package com.tuanhust.coreservice.config;

import com.tuanhust.coreservice.filters.GatewayFilter;
import com.tuanhust.coreservice.filters.InternalFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@EnableWebSecurity
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {
    private final GatewayFilter gatewayFilter;
    private final InternalFilter internalFilter;
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(authorizeRequests ->
                        authorizeRequests
                                .requestMatchers("/internal/**","/actuator/**").permitAll()
                                .anyRequest().authenticated())
                .sessionManagement(s->s.sessionCreationPolicy(
                        SessionCreationPolicy.STATELESS
                ))
                .addFilterBefore(gatewayFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(internalFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}