package com.eventvista.event_vista.security;

import com.eventvista.event_vista.model.User;
import com.eventvista.event_vista.model.AuthProvider;
import com.eventvista.event_vista.service.UserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    //Injects the frontend redirect URI application properties.
    @Value("${app.oauth2.authorizedRedirectUris}")
    private String authorizedRedirectUri;

    @Value("${jwt.cookie.name}")
    private String jwtCookieName;

    @Value("${jwt.cookie.secure}")
    private boolean jwtCookieSecure;

    @Value("${jwt.cookie.http-only}")
    private boolean jwtCookieHttpOnly;

    @Value("${jwt.cookie.same-site}")
    private String jwtCookieSameSite;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserService userService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        try {
            //getting user details like name, email, and picture.
            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
            Map<String, Object> attributes = oAuth2User.getAttributes();

            //extracting user attributes
            String emailAddress = (String) attributes.get("email");
            String name = (String) attributes.get("name");
            String pictureUrl = (String) attributes.get("picture");

            if (emailAddress == null) {
                throw new IllegalArgumentException("Email not found from OAuth2 provider");
            }

            // Checking if user exist and creating or updating user
            Optional<User> existingUser = userService.findByEmailAddress(emailAddress);
            User user = existingUser.orElseGet(() -> {
                User newUser = new User();
                newUser.setEmailAddress(emailAddress);
                newUser.setName(name);
                newUser.setProvider(AuthProvider.GOOGLE);
                newUser.setEmailVerified(true); // Google accounts are pre-verified
                newUser.setPictureUrl(pictureUrl); // Save profile picture from Google
                return newUser;
            });

            // Update user information if they already exist
            if (existingUser.isPresent()) {
                user.setName(name); // Update name in case it changed
                if (pictureUrl != null) {
                    user.setPictureUrl(pictureUrl);
                }
            }

            // Save user to the database
            user = userService.save(user);

            // Generate access and refresh tokens
            String accessToken = tokenProvider.generateAccessToken(authentication);
            String refreshToken = tokenProvider.generateRefreshToken(authentication);

            // Create access token cookie
            Cookie accessTokenCookie = new Cookie(jwtCookieName, accessToken);
            accessTokenCookie.setHttpOnly(jwtCookieHttpOnly);
            accessTokenCookie.setSecure(jwtCookieSecure);
            accessTokenCookie.setPath("/");
            accessTokenCookie.setMaxAge(900); // 15 minutes in seconds
            response.addCookie(accessTokenCookie);

            // Create refresh token cookie
            Cookie refreshTokenCookie = new Cookie(jwtCookieName + "_refresh", refreshToken);
            refreshTokenCookie.setHttpOnly(jwtCookieHttpOnly);
            refreshTokenCookie.setSecure(jwtCookieSecure);
            refreshTokenCookie.setPath("/api/auth/refresh");
            refreshTokenCookie.setMaxAge(604800); // 7 days in seconds
            response.addCookie(refreshTokenCookie);

            // Redirect to frontend with user info
            String redirectUrl = UriComponentsBuilder.fromUriString(authorizedRedirectUri)
                    .queryParam("userId", user.getId())
                    .build().toUriString();

            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        } catch (Exception ex) {
            // Log the error
            logger.error("OAuth2 authentication error", ex);

            // Redirect to frontend with error
            String redirectUrl = UriComponentsBuilder.fromUriString(authorizedRedirectUri)
                    .queryParam("error", "OAuth2 authentication failed")
                    .build().toUriString();

            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        }
    }
}
