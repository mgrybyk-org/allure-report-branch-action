FROM timbru31/java-node:17-alpine-jre-18

ARG RELEASE=2.23.1
ARG ALLURE_REPO=https://repo.maven.apache.org/maven2/io/qameta/allure/allure-commandline

RUN echo $RELEASE && \
    node --version && \
    java -version || echo no_java && \
    apk update && \
    apk add --no-cache wget unzip && \
    rm -rf /var/cache/apk/*

RUN wget --no-verbose -O /tmp/allure-$RELEASE.tgz $ALLURE_REPO/$RELEASE/allure-commandline-$RELEASE.tgz && \
    tar -xf /tmp/allure-$RELEASE.tgz && \
    rm -rf /tmp/* && \
    chmod -R +x /allure-$RELEASE/bin && \
    mv /allure-$RELEASE /allure-commandline

ENV ROOT=/app

RUN mkdir -p $ROOT

WORKDIR $ROOT
COPY ./entrypoint.sh /entrypoint.sh
COPY dist /app/js-action

ENTRYPOINT ["node", "/app/js-action/index.js"]
