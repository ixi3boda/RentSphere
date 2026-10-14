package com.example.RentSphere.SecurityConfig;

import net.javacrumbs.shedlock.core.LockProvider;
import net.javacrumbs.shedlock.provider.jdbctemplate.JdbcTemplateLockProvider;
import net.javacrumbs.shedlock.spring.annotation.EnableSchedulerLock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

import static net.javacrumbs.shedlock.spring.annotation.EnableSchedulerLock.InterceptMode.PROXY_METHOD;

/**
 * Cluster-wide locks for scheduled jobs, kept in the {@code shedlock} table.
 *
 * <p>Every replica runs the same {@code @Scheduled} methods, so without a lock a daily job would
 * run once per pod. {@code PROXY_METHOD} also guards direct calls such as the start-up demo
 * reset, and the lock times come from the database clock so pod clock drift does not matter.
 */
@Configuration
@EnableSchedulerLock(interceptMode = PROXY_METHOD, defaultLockAtMostFor = "PT30M")
public class SchedulerLockConfig {

    @Bean
    public LockProvider lockProvider(DataSource dataSource) {
        return new JdbcTemplateLockProvider(JdbcTemplateLockProvider.Configuration.builder()
                .withJdbcTemplate(new JdbcTemplate(dataSource))
                .usingDbTime()
                .build());
    }
}
