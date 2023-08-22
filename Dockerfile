FROM timbru31/java-node:17-jre-18

ARG RELEASE=2.23.1
ARG ALLURE_REPO=https://repo.maven.apache.org/maven2/io/qameta/allure/allure-commandline

RUN echo "===============" && \
    echo Allure: $RELEASE && \
    echo NodeJS: $(node --version) && \
    echo JAVA && \
    java -version && \
    echo "===============" && \
    wget --no-verbose -O /tmp/allure-$RELEASE.tgz $ALLURE_REPO/$RELEASE/allure-commandline-$RELEASE.tgz && \
    tar -xf /tmp/allure-$RELEASE.tgz && \
    rm -rf /tmp/* && \
    chmod -R +x /allure-$RELEASE/bin && \
    mv /allure-$RELEASE /allure-commandline

COPY dist /js-action

ENTRYPOINT ["node", "/js-action/index.js"]
