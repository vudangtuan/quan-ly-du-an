# Stage 1: Build
FROM openjdk:25-ea-jdk-oraclelinux9 AS build
WORKDIR /app

COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline

COPY src ./src
RUN ./mvnw clean package -DskipTests

# Stage 2: Run
FROM openjdk:25-ea-jdk-oraclelinux9
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

# Expose cổng 8001
EXPOSE 8001

ENTRYPOINT ["java", "-jar", "app.jar"]