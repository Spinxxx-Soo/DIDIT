package com.didit.server.api.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.orm.jpa.support.OpenEntityManagerInViewFilter;

@Configuration
public class OsivConfig {

    @Bean
    public FilterRegistrationBean<OpenEntityManagerInViewFilter> osivFilter() {
        OpenEntityManagerInViewFilter filter = new OpenEntityManagerInViewFilter() {
            @Override
            protected boolean shouldNotFilter(HttpServletRequest request) {
                String uri = request.getRequestURI();
                // 너의 SSE 엔드포인트들 제외
                return uri.matches("^/api/v1/channels/\\d+/stream$")
                        || uri.matches("^/api/v1/projects/\\d+/stream$");
            }
        };

        FilterRegistrationBean<OpenEntityManagerInViewFilter> reg = new FilterRegistrationBean<>(filter);
        reg.setOrder(Ordered.HIGHEST_PRECEDENCE + 10);
        reg.addUrlPatterns("/*");
        return reg;
    }
}
