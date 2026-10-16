import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.io.*;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.*;
import java.security.spec.RSAPublicKeySpec;
import java.math.BigInteger;
import java.util.*;
import java.util.concurrent.*;

/** Minimal same-origin Java backend for UniCore local deployments. */
public class Server {
    static final int PORT = Integer.parseInt(System.getenv().getOrDefault("UNICORE_PORT", "8000"));
    static final Path ROOT = Paths.get(System.getProperty("user.dir")).toAbsolutePath().normalize();
    static final Path WEB = ROOT.resolve("src");
    static final Path STORE = ROOT.resolve("server/data");
    static final Path USERS = STORE.resolve("users.tsv");
    static final String GOOGLE_CLIENT_ID = System.getenv().getOrDefault("UNICORE_GOOGLE_CLIENT_ID", "181294802056-sdn70jiuaq6v4567ivntn92av5331uqr.apps.googleusercontent.com");
    static final SecureRandom RANDOM = new SecureRandom();
    static final Map<String, User> users = new ConcurrentHashMap<>();
    static final Map<String, String> sessions = new ConcurrentHashMap<>();
    static final Map<String, User> byEmail = new ConcurrentHashMap<>();
    static final Map<String, Long> lastLogin = new ConcurrentHashMap<>();
    static volatile Map<String, PublicKey> googleKeys = Map.of();
    static volatile long googleKeysExpireAt = 0;

    static class User {
        String id, email, name, salt, hash, picture;
        User(String id, String email, String name, String salt, String hash) { this(id,email,name,salt,hash,""); }
        User(String id, String email, String name, String salt, String hash, String picture) { this.id=id; this.email=email; this.name=name; this.salt=salt; this.hash=hash; this.picture=picture==null?"":picture; }
    }

    public static void main(String[] args) throws Exception {
        Files.createDirectories(STORE); loadUsers();
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", PORT), 0);
        server.createContext("/api/", Server::api);
        server.createContext("/", Server::staticFile);
        server.setExecutor(Executors.newFixedThreadPool(Math.max(4, Runtime.getRuntime().availableProcessors())));
        server.start();
        System.out.println("UniCore running at http://localhost:" + PORT);
        System.out.println("Google sign-in: " + (GOOGLE_CLIENT_ID.isBlank() ? "not configured (set UNICORE_GOOGLE_CLIENT_ID)" : "configured"));
    }

    static void api(HttpExchange x) throws IOException {
        x.getResponseHeaders().set("Cache-Control", "no-store");
        x.getResponseHeaders().set("X-Content-Type-Options", "nosniff");
        String method=x.getRequestMethod(), path=x.getRequestURI().getPath();
        try {
            Map<String,Object> body = method.equals("POST") || method.equals("PUT") ? Json.object(new String(x.getRequestBody().readAllBytes(), StandardCharsets.UTF_8)) : Map.of();
            if (path.equals("/api/config") && method.equals("GET")) { send(x,200,Map.of("googleClientId",GOOGLE_CLIENT_ID)); return; }
            if (path.equals("/api/register") && method.equals("POST")) { register(x,body); return; }
            if (path.equals("/api/login") && method.equals("POST")) { login(x,body); return; }
            if (path.equals("/api/google") && method.equals("POST")) { google(x,body); return; }
            if (path.equals("/api/logout") && method.equals("POST")) { String token=cookie(x,"unicore_session");if(token!=null)sessions.remove(token);x.getResponseHeaders().add("Set-Cookie","unicore_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");send(x,200,Map.of("ok",true));return; }
            User user=current(x);
            if (path.equals("/api/me") && method.equals("GET")) { if(user==null){send(x,401,Map.of("error","Sign in required"));return;}send(x,200,Map.of("user",publicUser(user),"data",readData(user)));return; }
            if (path.equals("/api/data") && method.equals("GET")) { if(user==null){send(x,401,Map.of("error","Sign in required"));return;}send(x,200,Map.of("data",readData(user)));return; }
            if (path.equals("/api/data") && method.equals("PUT")) { if(user==null){send(x,401,Map.of("error","Sign in required"));return;}Object data=body.get("data");if(!(data instanceof Map<?,?>)){send(x,400,Map.of("error","Invalid workspace data"));return;}writeData(user,data);send(x,200,Map.of("ok",true));return; }
            send(x,404,Map.of("error","Not found"));
        } catch (IllegalArgumentException e) { send(x,400,Map.of("error",e.getMessage())); }
        catch (Exception e) { e.printStackTrace();send(x,500,Map.of("error","The server could not complete that request")); }
    }

    static synchronized void register(HttpExchange x, Map<String,Object> b) throws Exception {
        String name=str(b,"name").trim(), email=str(b,"email").trim().toLowerCase(Locale.ROOT), password=str(b,"password");
        if(name.length()<2||name.length()>80)throw new IllegalArgumentException("Enter a name between 2 and 80 characters.");
        if(!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))throw new IllegalArgumentException("Enter a valid email address.");
        if(password.length()<8||password.length()>256)throw new IllegalArgumentException("Password must be at least 8 characters.");
        if(byEmail.containsKey(email))throw new IllegalArgumentException("An account with this email already exists. Sign in instead.");
        byte[] salt=new byte[16];RANDOM.nextBytes(salt);String salt64=Base64.getEncoder().encodeToString(salt),hash=derive(password,salt);
        User u=new User(UUID.randomUUID().toString(),email,name,salt64,hash);users.put(u.id,u);byEmail.put(email,u);saveUsers();writeData(u,emptyWorkspace());startSession(x,u);send(x,201,Map.of("user",publicUser(u),"data",readData(u)));
    }

    static void login(HttpExchange x,Map<String,Object>b)throws Exception{
        String email=str(b,"email").trim().toLowerCase(Locale.ROOT),password=str(b,"password");long now=System.currentTimeMillis(),prev=lastLogin.getOrDefault(email,0L);if(now-prev<650)Thread.sleep(650-(now-prev));lastLogin.put(email,now);
        User u=byEmail.get(email);boolean ok=false;if(u!=null&&!u.salt.isBlank()&&!u.hash.isBlank()){byte[] salt=Base64.getDecoder().decode(u.salt);ok=MessageDigest.isEqual(Base64.getDecoder().decode(u.hash),Base64.getDecoder().decode(derive(password,salt)));}
        if(!ok)throw new IllegalArgumentException("Email or password is incorrect.");startSession(x,u);send(x,200,Map.of("user",publicUser(u),"data",readData(u)));
    }

    static void google(HttpExchange x,Map<String,Object>b)throws Exception{
        if(GOOGLE_CLIENT_ID.isBlank())throw new IllegalArgumentException("Google sign-in is not configured yet. Set UNICORE_GOOGLE_CLIENT_ID and restart UniCore.");
        String credential=str(b,"credential");if(credential.isBlank())throw new IllegalArgumentException("Google did not return an account credential.");
        Map<String,Object> token=verifyGoogleIdToken(credential);String email=String.valueOf(token.getOrDefault("email","")).toLowerCase(Locale.ROOT),verified=String.valueOf(token.getOrDefault("email_verified","false"));
        if(!verified.equalsIgnoreCase("true")||email.isBlank())throw new IllegalArgumentException("Google account verification failed.");
        String picture=String.valueOf(token.getOrDefault("picture",""));
        User u=byEmail.get(email);if(u==null){String name=String.valueOf(token.getOrDefault("name",email.substring(0,email.indexOf('@'))));u=new User(UUID.randomUUID().toString(),email,name,"","",picture);users.put(u.id,u);byEmail.put(email,u);saveUsers();writeData(u,emptyWorkspace());}else if(!picture.isBlank()&&!picture.equals(u.picture)){u.picture=picture;saveUsers();}
        startSession(x,u);send(x,200,Map.of("user",publicUser(u),"data",readData(u)));
    }

    static Map<String,Object> verifyGoogleIdToken(String compact)throws Exception{
        String[] parts=compact.split("\\.");if(parts.length!=3)throw new IllegalArgumentException("Google account verification failed.");
        Map<String,Object> header=Json.object(new String(Base64.getUrlDecoder().decode(parts[0]),StandardCharsets.UTF_8));
        Map<String,Object> claims=Json.object(new String(Base64.getUrlDecoder().decode(parts[1]),StandardCharsets.UTF_8));
        if(!"RS256".equals(header.get("alg")))throw new IllegalArgumentException("Google account verification failed.");
        String kid=String.valueOf(header.getOrDefault("kid",""));PublicKey key=googleKey(kid);if(key==null)throw new IllegalArgumentException("Google account verification failed.");
        Signature verifier=Signature.getInstance("SHA256withRSA");verifier.initVerify(key);verifier.update((parts[0]+"."+parts[1]).getBytes(StandardCharsets.US_ASCII));
        if(!verifier.verify(Base64.getUrlDecoder().decode(parts[2])))throw new IllegalArgumentException("Google account verification failed.");
        Object audience=claims.get("aud");boolean audienceMatches=GOOGLE_CLIENT_ID.equals(audience)||(audience instanceof List<?> && ((List<?>)audience).contains(GOOGLE_CLIENT_ID));
        String issuer=String.valueOf(claims.getOrDefault("iss",""));long expiry=claims.get("exp") instanceof Number?((Number)claims.get("exp")).longValue():0;
        if(!audienceMatches||!(issuer.equals("accounts.google.com")||issuer.equals("https://accounts.google.com"))||expiry<System.currentTimeMillis()/1000||String.valueOf(claims.getOrDefault("sub","")).isBlank())throw new IllegalArgumentException("Google account verification failed.");
        return claims;
    }

    static synchronized PublicKey googleKey(String kid)throws Exception{
        if(System.currentTimeMillis()>=googleKeysExpireAt||!googleKeys.containsKey(kid)){
            HttpRequest req=HttpRequest.newBuilder(URI.create("https://www.googleapis.com/oauth2/v3/certs")).timeout(java.time.Duration.ofSeconds(8)).GET().build();
            HttpResponse<String> resp=HttpClient.newHttpClient().send(req,HttpResponse.BodyHandlers.ofString());if(resp.statusCode()!=200)return null;
            Map<String,Object> doc=Json.object(resp.body());Map<String,PublicKey> keys=new HashMap<>();Object rows=doc.get("keys");if(rows instanceof List<?>)for(Object row:(List<?>)rows){if(!(row instanceof Map<?,?>))continue;Map<?,?> jwk=(Map<?,?>)row;if(!"RSA".equals(jwk.get("kty"))||!(jwk.get("kid") instanceof String))continue;BigInteger n=new BigInteger(1,Base64.getUrlDecoder().decode(String.valueOf(jwk.get("n"))));BigInteger e=new BigInteger(1,Base64.getUrlDecoder().decode(String.valueOf(jwk.get("e"))));keys.put(String.valueOf(jwk.get("kid")),KeyFactory.getInstance("RSA").generatePublic(new RSAPublicKeySpec(n,e)));}
            String cc=resp.headers().firstValue("Cache-Control").orElse("");java.util.regex.Matcher max=java.util.regex.Pattern.compile("max-age=(\\d+)").matcher(cc);long seconds=max.find()?Long.parseLong(max.group(1)):3600;googleKeys=Map.copyOf(keys);googleKeysExpireAt=System.currentTimeMillis()+Math.max(60,seconds)*1000;
        }return googleKeys.get(kid);
    }

    static Object emptyWorkspace(){return Map.of("notes",List.of(),"tasks",List.of(),"expenses",List.of(),"deadlines",List.of(),"queue",List.of());}
    static Map<String,Object> publicUser(User u){Map<String,Object> result=new LinkedHashMap<>();result.put("id",u.id);result.put("email",u.email);result.put("name",u.name);if(!u.picture.isBlank())result.put("picture",u.picture);return result;}
    static Object readData(User u)throws IOException{Path p=STORE.resolve(u.id+".json");if(!Files.exists(p))return emptyWorkspace();return Json.parse(Files.readString(p));}
    static void writeData(User u,Object d)throws IOException{Path p=STORE.resolve(u.id+".json"),tmp=STORE.resolve(u.id+".tmp");Files.writeString(tmp,Json.stringify(d),StandardCharsets.UTF_8);Files.move(tmp,p,StandardCopyOption.REPLACE_EXISTING,StandardCopyOption.ATOMIC_MOVE);}
    static synchronized void loadUsers()throws IOException{if(!Files.exists(USERS))return;for(String line:Files.readAllLines(USERS)){String[] p=line.split("\t",-1);if(p.length>=5){User u=new User(dec(p[0]),dec(p[1]),dec(p[2]),p[3],p[4],p.length>=6?dec(p[5]):"");users.put(u.id,u);byEmail.put(u.email,u);}}}
    static synchronized void saveUsers()throws IOException{List<String> rows=new ArrayList<>();for(User u:users.values())rows.add(enc(u.id)+"\t"+enc(u.email)+"\t"+enc(u.name)+"\t"+u.salt+"\t"+u.hash+"\t"+enc(u.picture));Files.write(USERS,rows,StandardCharsets.UTF_8);}
    static String enc(String s){return Base64.getUrlEncoder().withoutPadding().encodeToString(s.getBytes(StandardCharsets.UTF_8));}static String dec(String s){return new String(Base64.getUrlDecoder().decode(s),StandardCharsets.UTF_8);}
    static String derive(String password,byte[] salt)throws Exception{PBEKeySpec spec=new PBEKeySpec(password.toCharArray(),salt,210000,256);byte[] key=SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();spec.clearPassword();return Base64.getEncoder().encodeToString(key);}
    static void startSession(HttpExchange x,User u){byte[] bytes=new byte[32];RANDOM.nextBytes(bytes);String token=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);sessions.put(token,u.id);x.getResponseHeaders().add("Set-Cookie","unicore_session="+token+"; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800");}
    static User current(HttpExchange x){String token=cookie(x,"unicore_session"),id=token==null?null:sessions.get(token);return id==null?null:users.get(id);}
    static String cookie(HttpExchange x,String key){String c=x.getRequestHeaders().getFirst("Cookie");if(c==null)return null;for(String part:c.split(";")){String[] p=part.trim().split("=",2);if(p.length==2&&p[0].equals(key))return p[1];}return null;}
    static String str(Map<String,Object>m,String k){Object v=m.get(k);return v instanceof String?(String)v:"";}
    static void send(HttpExchange x,int status,Object value)throws IOException{byte[] out=Json.stringify(value).getBytes(StandardCharsets.UTF_8);x.getResponseHeaders().set("Content-Type","application/json; charset=utf-8");x.getResponseHeaders().set("X-Content-Type-Options","nosniff");x.sendResponseHeaders(status,out.length);try(OutputStream o=x.getResponseBody()){o.write(out);}}
    static void staticFile(HttpExchange x)throws IOException{if(!x.getRequestMethod().equals("GET")&& !x.getRequestMethod().equals("HEAD")){x.sendResponseHeaders(405,-1);return;}String path=URLDecoder.decode(x.getRequestURI().getPath(),StandardCharsets.UTF_8);if(path.equals("/"))path="/index.html";Path file=WEB.resolve(path.substring(1)).normalize();if(!file.startsWith(WEB)||!Files.isRegularFile(file)){x.sendResponseHeaders(404,-1);return;}String type=Files.probeContentType(file);if(type==null)type="application/octet-stream";if(file.toString().endsWith(".js"))type="text/javascript; charset=utf-8";if(file.toString().endsWith(".css"))type="text/css; charset=utf-8";x.getResponseHeaders().set("Content-Type",type);x.getResponseHeaders().set("X-Content-Type-Options","nosniff");if(x.getRequestMethod().equals("HEAD")){x.sendResponseHeaders(200,-1);return;}byte[] bytes=Files.readAllBytes(file);x.sendResponseHeaders(200,bytes.length);try(OutputStream o=x.getResponseBody()){o.write(bytes);}}

    static class Json {
        static Object parse(String s){return new Parser(s).value();}
        @SuppressWarnings("unchecked") static Map<String,Object> object(String s){Object o=parse(s);if(!(o instanceof Map))throw new IllegalArgumentException("Invalid JSON request");return(Map<String,Object>)o;}
        static String stringify(Object o){StringBuilder b=new StringBuilder();write(o,b);return b.toString();}
        static void write(Object o,StringBuilder b){if(o==null){b.append("null");return;}if(o instanceof String){b.append('"');for(char c:((String)o).toCharArray()){switch(c){case '"':b.append("\\\"");break;case '\\':b.append("\\\\");break;case '\n':b.append("\\n");break;case '\r':b.append("\\r");break;case '\t':b.append("\\t");break;default:if(c<32)b.append(String.format("\\u%04x",(int)c));else b.append(c);}}b.append('"');return;}if(o instanceof Number||o instanceof Boolean){b.append(o);return;}if(o instanceof Map){b.append('{');boolean f=true;for(Object e0:((Map<?,?>)o).entrySet()){Map.Entry<?,?>e=(Map.Entry<?,?>)e0;if(!f)b.append(',');f=false;write(String.valueOf(e.getKey()),b);b.append(':');write(e.getValue(),b);}b.append('}');return;}if(o instanceof Iterable){b.append('[');boolean f=true;for(Object v:(Iterable<?>)o){if(!f)b.append(',');f=false;write(v,b);}b.append(']');return;}write(o.toString(),b);}
        static class Parser {final String s;int i=0;Parser(String s){this.s=s;}void ws(){while(i<s.length()&&Character.isWhitespace(s.charAt(i)))i++;}Object value(){ws();if(i>=s.length())throw new IllegalArgumentException("Invalid JSON");char c=s.charAt(i);if(c=='{')return obj();if(c=='[')return arr();if(c=='"')return str();if(c=='t'){i+=4;return true;}if(c=='f'){i+=5;return false;}if(c=='n'){i+=4;return null;}return num();}Map<String,Object>obj(){Map<String,Object>m=new LinkedHashMap<>();i++;ws();if(s.charAt(i)=='}'){i++;return m;}while(true){ws();String k=str();ws();i++;Object v=value();m.put(k,v);ws();char c=s.charAt(i++);if(c=='}')return m;}}List<Object>arr(){List<Object>a=new ArrayList<>();i++;ws();if(s.charAt(i)==']'){i++;return a;}while(true){a.add(value());ws();char c=s.charAt(i++);if(c==']')return a;}}String str(){StringBuilder b=new StringBuilder();i++;while(i<s.length()){char c=s.charAt(i++);if(c=='"')return b.toString();if(c=='\\'){char e=s.charAt(i++);switch(e){case 'n':b.append('\n');break;case 'r':b.append('\r');break;case 't':b.append('\t');break;case 'b':b.append('\b');break;case 'f':b.append('\f');break;case 'u':b.append((char)Integer.parseInt(s.substring(i,i+4),16));i+=4;break;default:b.append(e);}}else b.append(c);}throw new IllegalArgumentException("Invalid JSON string");}Number num(){int a=i;while(i<s.length()&&"-+0123456789.eE".indexOf(s.charAt(i))>=0)i++;String n=s.substring(a,i);try{if(n.contains(".")||n.contains("e")||n.contains("E"))return Double.parseDouble(n);return Long.parseLong(n);}catch(Exception e){throw new IllegalArgumentException("Invalid JSON number");}}
        }
    }
}
