package com.eventvista.event_vista.controller;

import com.eventvista.event_vista.data.UserRepository;
import com.eventvista.event_vista.model.User;
import com.eventvista.event_vista.model.AuthProvider;
import com.eventvista.event_vista.model.dto.LoginFormDTO;
import com.eventvista.event_vista.model.dto.RegisterFormDTO;
import com.eventvista.event_vista.model.dto.ResetPasswordDTO;
import com.eventvista.event_vista.model.dto.UserProfileDTO;
import com.eventvista.event_vista.security.JwtTokenProvider;
import com.eventvista.event_vista.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.eventvista.event_vista.service.UserService;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class JwtAuthenticationController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserService userService;

    @Value("${app.email.verification.token.expiration}")
    private long verificationTokenExpiration;

    @Value("${jwt.cookie.name}")
    private String jwtCookieName;

    @Value("${jwt.cookie.secure}")
    private boolean jwtCookieSecure;

    @Value("${jwt.cookie.http-only}")
    private boolean jwtCookieHttpOnly;

    @Value("${jwt.cookie.same-site}")
    private String jwtCookieSameSite;

    @GetMapping("/all")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Register a new user
    @PostMapping("/register")
    public ResponseEntity<?> processRegistrationForm(@RequestBody @Valid RegisterFormDTO registerFormDTO) {
        // Check if email exists
        Optional<User> existingUser = userRepository.findByEmailAddress(registerFormDTO.getEmailAddress());
        if (existingUser.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is already in use!"));
        }

        // Create new user
        User user = new User();
        user.setName(registerFormDTO.getUsername());
        user.setEmailAddress(registerFormDTO.getEmailAddress());
        String encodedPassword = passwordEncoder.encode(registerFormDTO.getPassword());
        user.setPasswordHash(encodedPassword);

        user.setProvider(AuthProvider.LOCAL);

        // Set verification token
        String verificationToken = UUID.randomUUID().toString();
        user.setVerificationToken(verificationToken);
        user.setVerificationTokenExpiryDate(LocalDateTime.now().plusHours(24));
        user.setEmailVerified(false);

        System.out.println("Creating new user with email: " + user.getEmailAddress());
        System.out.println("Verification token: " + verificationToken);

        userRepository.save(user);
        System.out.println("User saved successfully with ID: " + user.getId());

        // Send verification email
        try {
            emailService.sendVerificationEmail(user.getEmailAddress(), verificationToken);
            System.out.println("Verification email sent successfully");
        } catch (MessagingException e) {
            System.err.println("Failed to send verification email: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to send verification email. Please try again."));
        }

        return ResponseEntity.ok(Map.of("message", "Registration successful! Please check your email to verify your account."));
    }

    @PostMapping("/login")
    public ResponseEntity<?> processLoginForm(@RequestBody @Valid LoginFormDTO loginFormDTO, HttpServletResponse response) {
        System.out.println("=== LOGIN ATTEMPT START ===");
        System.out.println("Login attempt for email: " + loginFormDTO.getEmailAddress());

        try {
            Optional<User> userOptional = userRepository.findByEmailAddress(loginFormDTO.getEmailAddress());
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid credentials"));
            }

            User user = userOptional.get();

            if (!user.isEmailVerified()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Please verify your email before logging in"));
            }

            if (!user.isMatchingPassword(loginFormDTO.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid credentials"));
            }

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginFormDTO.getEmailAddress(),
                            loginFormDTO.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Generate both access and refresh tokens
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

            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("user", user);
            responseBody.put("message", "Login successful");

            return ResponseEntity.ok(responseBody);
        } catch (Exception e) {
            System.err.println("=== LOGIN ATTEMPT FAILED ===");
            System.err.println("Authentication failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid credentials"));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletResponse response) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "No authentication found"));
            }

            // Generate new access token
            String newAccessToken = tokenProvider.generateAccessToken(authentication);

            // Create new access token cookie
            Cookie accessTokenCookie = new Cookie(jwtCookieName, newAccessToken);
            accessTokenCookie.setHttpOnly(jwtCookieHttpOnly);
            accessTokenCookie.setSecure(jwtCookieSecure);
            accessTokenCookie.setPath("/");
            accessTokenCookie.setMaxAge(900); // 15 minutes in seconds
            response.addCookie(accessTokenCookie);

            return ResponseEntity.ok(Map.of("message", "Token refreshed successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Failed to refresh token"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        // Clear access token cookie
        Cookie accessTokenCookie = new Cookie(jwtCookieName, null);
        accessTokenCookie.setHttpOnly(jwtCookieHttpOnly);
        accessTokenCookie.setSecure(jwtCookieSecure);
        accessTokenCookie.setPath("/");
        accessTokenCookie.setMaxAge(0);
        response.addCookie(accessTokenCookie);

        // Clear refresh token cookie
        Cookie refreshTokenCookie = new Cookie(jwtCookieName + "_refresh", null);
        refreshTokenCookie.setHttpOnly(jwtCookieHttpOnly);
        refreshTokenCookie.setSecure(jwtCookieSecure);
        refreshTokenCookie.setPath("/api/auth/refresh");
        refreshTokenCookie.setMaxAge(0);
        response.addCookie(refreshTokenCookie);

        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    //Confirms the user's token is valid and not expired.
    @GetMapping("/verify")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        System.out.println("Received verification request with token: " + token);

        Optional<User> userOptional = userRepository.findByVerificationToken(token);

        if (userOptional.isEmpty()) {
            System.out.println("No user found with token: " + token);
            // Check if any user was recently verified with this token
            List<User> recentlyVerifiedUsers = userRepository.findByEmailVerifiedTrue();
            for (User user : recentlyVerifiedUsers) {
                // If we find a verified user and their token was recently nullified,
                // this is likely a duplicate request
                if (user.getVerificationToken() == null) {
                    System.out.println("Found already verified user: " + user.getEmailAddress());
                    return ResponseEntity.ok(Map.of("message", "Email already verified! You can now log in."));
                }
            }
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid verification token"));
        }

        // If user is found, check if token is expired
        User user = userOptional.get();
        System.out.println("Found user: " + user.getEmailAddress() + " with verification token: " + user.getVerificationToken());

        // Check if token is expired
        if (user.getVerificationTokenExpiryDate().isBefore(LocalDateTime.now())) {
            System.out.println("Token expired. Expiry date: " + user.getVerificationTokenExpiryDate() + ", Current time: " + LocalDateTime.now());
            return ResponseEntity.badRequest().body(Map.of("message", "Verification token has expired"));
        }

        // If email is already verified, return success
        if (user.isEmailVerified()) {
            return ResponseEntity.ok(Map.of("message", "Email already verified! You can now log in."));
        }

        // Mark email as verified
        user.setEmailVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiryDate(null);
        userRepository.save(user);
        System.out.println("Successfully verified email for user: " + user.getEmailAddress());

        return ResponseEntity.ok(Map.of("message", "Email verified successfully! You can now log in."));
    }

    //Generating a new verification token and sending it to the user's email address.
    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@RequestParam String emailAddress) {
        Optional<User> userOptional = userRepository.findByEmailAddress(emailAddress);

        // Check if user exists
        if (userOptional.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found");
        }

        User user = userOptional.get();

        // Check if email is already verified
        if (user.isEmailVerified()) {
            return ResponseEntity.badRequest().body("Email is already verified");
        }

        // Generate new verification token
        String verificationToken = UUID.randomUUID().toString();
        user.setVerificationToken(verificationToken);
        user.setVerificationTokenExpiryDate(LocalDateTime.now().plusHours(1));
        userRepository.save(user);

        // Send new verification email
        try {
            emailService.sendVerificationEmail(user.getEmailAddress(), verificationToken);
        } catch (MessagingException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to send verification email. Please try again.");
        }

        return ResponseEntity.ok("Verification email sent! Please check your inbox.");
    }

    @GetMapping("/user")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {
        try {
            // Get token from cookie
            Cookie[] cookies = request.getCookies();
            if (cookies != null) {
                for (Cookie cookie : cookies) {
                    if (jwtCookieName.equals(cookie.getName())) {
                        String token = cookie.getValue();
                        if (tokenProvider.validateToken(token)) {
                            String emailAddress = tokenProvider.getUsernameFromToken(token);
                            Optional<User> userOptional = userRepository.findByEmailAddress(emailAddress);
                            if (userOptional.isPresent()) {
                                User user = userOptional.get();
                                UserProfileDTO dto = new UserProfileDTO();
                                dto.setId(user.getId());
                                dto.setName(user.getName());
                                dto.setEmailAddress(user.getEmailAddress());
                                dto.setPictureUrl(user.getPictureUrl());
                                return ResponseEntity.ok(dto);
                            }
                        }
                    }
                }
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No valid token found");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired token");
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody @Valid ResetPasswordDTO resetPasswordDTO) {
        Optional<User> userOptional = userRepository.findByEmailAddress(resetPasswordDTO.getEmailAddress());
        if (userOptional.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found");
        }

        User user = userOptional.get();

        // Check if email is verified
        if (!user.isEmailVerified()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Please verify your email address before resetting password");
        }

        // Validate password match
        if (!resetPasswordDTO.getNewPassword().equals(resetPasswordDTO.getVerifyPassword())) {
            return ResponseEntity.badRequest().body("Passwords do not match");
        }

        try {
            user.setPasswordHash(passwordEncoder.encode(resetPasswordDTO.getNewPassword()));
            userRepository.save(user);
            System.out.println("Password reset successful for user: " + user.getEmailAddress());
            return ResponseEntity.ok("Password successfully reset");
        } catch (Exception e) {
            System.err.println("Error resetting password: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to reset password. Please try again.");
        }
    }

    @GetMapping("/test-email")
    public ResponseEntity<?> testEmail(@RequestParam String toEmail) {
        try {
            emailService.sendVerificationEmail(toEmail, "test-token-123");
            return ResponseEntity.ok("Test email sent successfully!");
        } catch (MessagingException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to send email: " + e.getMessage());
        }
    }

    // Update user profile
    @PutMapping("/update-profile")
    public ResponseEntity<?> updateUserProfileJwt(@RequestBody UserProfileDTO profileDTO,
                                                  HttpServletRequest request) {
        try {
            // Get token from cookie
            Cookie[] cookies = request.getCookies();
            if (cookies != null) {
                for (Cookie cookie : cookies) {
                    if (jwtCookieName.equals(cookie.getName())) {
                        String token = cookie.getValue();
                        if (tokenProvider.validateToken(token)) {
                            String email = tokenProvider.getUsernameFromToken(token);
                            try {
                                //Updates user profile info using UserService
                                User updatedUser = userService.updateUserProfile(email, profileDTO);
                                return ResponseEntity.ok(new UserProfileDTO(
                                        updatedUser.getId(),
                                        updatedUser.getName(),
                                        updatedUser.getEmailAddress(),
                                        updatedUser.getPictureUrl()
                                ));
                            } catch (RuntimeException ex) {
                                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
                            }
                        }
                    }
                }
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No valid token found");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired token");
        }
    }

    @PostMapping("/delete")
    public ResponseEntity<?> deleteUser(HttpServletRequest request) {
        try {
            // Get token from cookie
            Cookie[] cookies = request.getCookies();
            if (cookies != null) {
                for (Cookie cookie : cookies) {
                    if (jwtCookieName.equals(cookie.getName())) {
                        String token = cookie.getValue();
                        if (tokenProvider.validateToken(token)) {
                            String email = tokenProvider.getUsernameFromToken(token);
                            Optional<User> userOpt = userRepository.findByEmailAddress(email);
                            if (userOpt.isPresent()) {
                                User user = userOpt.get();
                                userRepository.delete(user);
                                return ResponseEntity.ok("User deleted successfully");
                            }
                        }
                    }
                }
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No valid token found");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired token");
        }
    }


}