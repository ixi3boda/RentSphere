package com.example.RentSphere.Service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;

/**
 * Restores the public demo to its curated dataset.
 *
 * <p>The live demo publishes its logins, so anyone can add, edit or delete data through
 * them. Reloading {@code db/seed-demo.sql} on start-up and once a day bounds how long junk
 * can stay visible, and because the seed's dates are relative to the load day it also keeps
 * the leases and installments current.
 *
 * <p>This <strong>empties every table</strong>, including accounts visitors registered, so it
 * is off unless {@code rentsphere.demo.reset-enabled=true}. Never enable it on a database
 * that holds real data.
 */
@Service
@Slf4j
@ConditionalOnProperty(name = "rentsphere.demo.reset-enabled", havingValue = "true")
public class DemoDataResetService {

    private final DataSource dataSource;

    public DemoDataResetService(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Scheduled(cron = "${rentsphere.demo.reset-cron:0 0 3 * * *}")
    public void reset() {
        // One connection for the whole script: it relies on session state (@today, FK checks).
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator(new ClassPathResource("db/seed-demo.sql"));
        populator.setSqlScriptEncoding("UTF-8");
        try {
            populator.execute(dataSource);
            log.info("Demo dataset reloaded");
        } catch (RuntimeException e) {
            // A failed reload must not take the API down with it; the next run tries again.
            log.error("Demo dataset reload failed", e);
        }
    }
}
