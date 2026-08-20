FROM maven:3.9.9-eclipse-temurin-21-alpine AS build

WORKDIR /workspace

COPY pom.xml ./
RUN mvn --batch-mode --no-transfer-progress dependency:go-offline

COPY src ./src
RUN mvn --batch-mode --no-transfer-progress -DskipTests package \
    && cp "$(find target -maxdepth 1 -type f -name '*.jar' | head -n 1)" /workspace/application.jar

FROM eclipse-temurin:21-jre-alpine AS runtime

RUN apk add --no-cache curl \
    && addgroup -S spring \
    && adduser -S -G spring spring

WORKDIR /app

COPY --from=build --chown=spring:spring /workspace/application.jar ./application.jar

USER spring:spring

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/application.jar"]
