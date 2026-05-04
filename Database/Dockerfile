FROM mysql:8.0

# Copy the schema file to the initialization directory
# Scripts in /docker-entrypoint-initdb.d/ are automatically run on container startup
COPY Schema.sql /docker-entrypoint-initdb.d/init.sql
