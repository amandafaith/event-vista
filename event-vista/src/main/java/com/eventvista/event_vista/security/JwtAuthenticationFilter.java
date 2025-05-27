package com.eventvista.event_vista.security;

import com.eventvista.event_vista.service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Optional;

// This filter checks for the presence of a JWT token in the request header
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenProvider tokenProvider;

    //Loading the user details from the database using the email (username) found in the token.
    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Value("${jwt.cookie.name}")
    private String jwtCookieName;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String requestUri = request.getRequestURI();

            // Skip token validation for public endpoints
            if (isPublicEndpoint(requestUri)) {
                filterChain.doFilter(request, response);
                return;
            }

            String jwt = getJwtFromRequest(request);
            if (jwt != null && tokenProvider.validateToken(jwt)) {
                String tokenType = tokenProvider.getTokenType(jwt);

                if ("access".equals(tokenType)) {
                    String username = tokenProvider.getUsernameFromToken(jwt);
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } else {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("Invalid token type");
                    return;
                }
            }
        } catch (Exception ex) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Authentication failed: " + ex.getMessage());
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isPublicEndpoint(String requestUri) {
        return requestUri.equals("/api/auth/refresh") ||
                requestUri.equals("/api/auth/login") ||
                requestUri.equals("/api/auth/register") ||
                requestUri.equals("/api/auth/verify") ||
                requestUri.equals("/api/auth/resend-verification") ||
                requestUri.equals("/api/auth/reset-password") ||
                requestUri.equals("/api/auth/user") ||
                requestUri.equals("/api/auth/logout") ||
                requestUri.startsWith("/oauth2/") ||
                requestUri.startsWith("/login/oauth2/") ||
                requestUri.startsWith("/api/public/");
    }

    // Extracting the JWT token from the request header
    //If the header starts with "Bearer ", it extracts the JWT string.
    private String getJwtFromRequest(HttpServletRequest request) {
        // First try to get token from cookie
        if (request.getCookies() != null) {
            Optional<Cookie> jwtCookie = Arrays.stream(request.getCookies())
                    .filter(cookie -> jwtCookieName.equals(cookie.getName()))
                    .findFirst();

            if (jwtCookie.isPresent()) {
                return jwtCookie.get().getValue();
            }
        }

        return null;
    }
}
