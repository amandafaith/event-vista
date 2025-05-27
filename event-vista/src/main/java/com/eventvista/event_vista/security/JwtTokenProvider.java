package com.eventvista.event_vista.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.access-token.expiration}")
    private int accessTokenExpirationInMs;

    @Value("${jwt.refresh-token.expiration}")
    private int refreshTokenExpirationInMs;

    // creating a signing key for JWT token. Ensures that the token cannot be forged without the secret key.
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(Authentication authentication) {
        return generateToken(authentication, accessTokenExpirationInMs, "access");
    }

    public String generateRefreshToken(Authentication authentication) {
        return generateToken(authentication, refreshTokenExpirationInMs, "refresh");
    }

    private String generateToken(Authentication authentication, long expirationInMs, String tokenType) {
        // Get the authenticated principal (the user who just logged in)
        // This could be either an OAuth2User (Google login) or a UserDetails (email/password login)
        Object principal = authentication.getPrincipal();
        // Declaring a variable to hold the user's email address
        String email;

        // Checking if the authenticated principal is an actual Google OAuth2 user
        if (principal instanceof org.springframework.security.oauth2.core.user.OAuth2User) {
            // Cast the principal to OAuth2User so we can access Google-specific attributes
            org.springframework.security.oauth2.core.user.OAuth2User oauth2User =
                    (org.springframework.security.oauth2.core.user.OAuth2User) principal;
            // Extract the user's email from the OAuth2 attributes
            email = (String) oauth2User.getAttributes().get("email");
        } else if (principal instanceof org.springframework.security.core.userdetails.User) {
            // Cast the principal to User (used in standard email/password login)
            org.springframework.security.core.userdetails.User userDetails =
                    (org.springframework.security.core.userdetails.User) principal;
            email = userDetails.getUsername(); // This will return the email (which is stored as the username in UserDetails)
        } else {
            throw new IllegalStateException("Unsupported authentication principal type: " + principal.getClass());
        }

        //Setting the issue time and expiration time for the token.
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationInMs);

        Map<String, Object> claims = new HashMap<>();
        claims.put("type", tokenType);
        claims.put("email", email);

        // Creating the JWT token using the builder pattern
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(email)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    // Extracting the username (email) from the JWT token
    public String getUsernameFromToken(String token) {
        // Parsing the JWT token and extracting the claims
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    public String getTokenType(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.get("type", String.class);
    }

    // Validating the JWT token
    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(authToken);
            return true;
        } catch (SignatureException ex) {
            System.err.println("Invalid JWT signature");
        } catch (MalformedJwtException ex) {
            System.err.println("Invalid JWT token");
        } catch (ExpiredJwtException ex) {
            System.err.println("Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            System.err.println("Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            System.err.println("JWT claims string is empty");
        }
        return false;
    }

    public boolean isTokenExpired(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            return claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return true;
        }
    }
}

