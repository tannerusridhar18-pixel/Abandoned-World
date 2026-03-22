package com.abandonedworld.backend.security;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.util.Date;
import org.springframework.stereotype.Component;
@Component
public class JwtUtil {
    private final String SECRET = "abandonedworld_secret_key_abandonedworld_secret_key";
    private Key getSigningKey() { return Keys.hmacShaKeyFor(SECRET.getBytes()); }
    public String generateToken(String email, String role) {
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }
    public Claims extractClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token).getBody();
    }
    public String extractEmail(String token) { return extractClaims(token).getSubject(); }
    public String extractRole(String token) { return extractClaims(token).get("role", String.class); }
    public boolean isTokenExpired(String token) { return extractClaims(token).getExpiration().before(new Date()); }
}
