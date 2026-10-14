package com.example.RentSphere.integration;

import com.example.RentSphere.Service.ContractSchedulerService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.sql.Timestamp;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("Scheduled job locking")
class SchedulerLockTest {

    @Autowired private ContractSchedulerService contractSchedulerService;
    @Autowired private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("the daily contract job takes the contract-events lock")
    void processContractEvents_recordsLock() {
        contractSchedulerService.processContractEvents();

        Timestamp lockUntil = jdbcTemplate.queryForObject(
                "SELECT lock_until FROM shedlock WHERE name = 'contract-events'", Timestamp.class);
        assertThat(lockUntil).isNotNull();
    }

    @Test
    @DisplayName("a second run while the lock is held is skipped")
    void processContractEvents_skipsWhileLocked() {
        contractSchedulerService.processContractEvents();
        Timestamp first = jdbcTemplate.queryForObject(
                "SELECT locked_at FROM shedlock WHERE name = 'contract-events'", Timestamp.class);

        contractSchedulerService.processContractEvents();
        Timestamp second = jdbcTemplate.queryForObject(
                "SELECT locked_at FROM shedlock WHERE name = 'contract-events'", Timestamp.class);

        // lockAtLeastFor is 5 minutes, so the second call cannot re-acquire the lock
        assertThat(second).isEqualTo(first);
    }
}
