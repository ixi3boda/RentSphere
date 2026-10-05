package com.example.RentSphere.SecurityConfig;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.function.Function;

/**
 * Stateless JWT utility for token generation and validation.
 *
 * <p>Tokens are signed with HMAC-SHA256 using a secret loaded from
 * {@code ${jwt.secret}} (must be ≥ 32 characters for a 256-bit key).
 * The token payload embeds the user's email as the subject and their role
 * as a custom claim; no server-side session or token store is maintained.
 *
 * <p>Token lifetime is hard-coded to 7 days. The expiration is checked on
 * every protected request by {@link JwtAuthenticationFilter}.
 */
@Service
public class JwtService {

    private final String secretKey;

    public JwtService(@Value("${jwt.secret}") String secretKey) {
        this.secretKey = secretKey;
    }

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes());
    }

    /**
     * Extracts the subject claim (the user's email) from a JWT.
     *
     * @param token a signed JWT string
     * @return the email stored as the token subject
     * @throws io.jsonwebtoken.JwtException if the token is malformed or the signature is invalid
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extracts an arbitrary claim from a JWT using the provided resolver function.
     *
     * @param <T>            the type of the claim value
     * @param token          a signed JWT string
     * @param claimsResolver a function that maps the decoded {@link Claims} to the desired value
     * @return the resolved claim value
     * @throws io.jsonwebtoken.JwtException if the token is malformed or the signature is invalid
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claimsResolver.apply(claims);
    }

    /**
     * Generates a signed JWT for the given user.
     *
     * <p>The token embeds:
     * <ul>
     *   <li>{@code sub} - the user's email (used as the Spring Security principal name)</li>
     *   <li>{@code role} - the user's role name ({@code ADMIN}, {@code TENANT}, or {@code VISITOR})</li>
     *   <li>{@code iat} / {@code exp} - issued-at and expiry timestamps (7-day lifetime)</li>
     * </ul>
     *
     * @param email the user's email address
     * @param role  the user's role name
     * @return a compact, URL-safe JWT string ready to be returned in the auth response
     */
    public String generateToken(String email, String role) {
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000L * 60 * 60 * 24 * 7))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Validates a JWT against a known username.
     *
     * @param token    the JWT to validate
     * @param username the username (email) expected as the token subject
     * @return {@code true} if the subject matches and the token has not expired
     */
    public boolean isTokenValid(String token, String username) {
        return username.equals(extractUsername(token)) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }
}
