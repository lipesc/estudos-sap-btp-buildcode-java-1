package customer.estudos_buildcode_java_1;

import org.springframework.core.annotation.Order;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@Profile("default")
public class LocalSecurityConfiguration {

    @Bean
    @Order(0)
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher(
                "/",
                "/index.html",
                "/favicon.ico",
                "/com.estudos.buildcode.java1.ui/**",
                "/service/**",
                "/odata/**",
                "/$fiori-preview/**"
            )
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/",
                    "/index.html",
                    "/favicon.ico",
                    "/com.estudos.buildcode.java1.ui/**",
                    "/service/**",
                    "/odata/**",
                    "/$fiori-preview/**"
                ).permitAll()
                .anyRequest().permitAll())
            .anonymous(anonymous -> {})
            .httpBasic(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable)
            .logout(AbstractHttpConfigurer::disable);

        return http.build();
    }
}
