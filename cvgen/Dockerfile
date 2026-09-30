# Ubuntu 24.04 LTS (noble): newest Debian-family LTS that still ships
# wkhtmltopdf in its repos (Debian 12/13 removed it with the Qt5 stack).
# Native arm64 build — no emulation needed.
FROM ubuntu:noble

ARG BUILD_DATE
LABEL maintainer="contact@emircanerkul.com"
LABEL org.label-schema.schema-version="1.0"
LABEL org.label-schema.build-date=$BUILD_DATE
LABEL org.label-schema.name="emircanerkul/cvgen"
LABEL org.label-schema.description="Customizable CV Generator"
LABEL org.label-schema.url="http://github.com/emircanerkul/cvgen"
LABEL org.label-schema.vendor="Emircan ERKUL"
LABEL org.label-schema.version="1.0.0"

ENV DEBIAN_FRONTEND=noninteractive

# --no-install-recommends keeps the image slim; fonts added for PDF rendering
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        apache2 \
        libapache2-mod-php \
        wkhtmltopdf \
        fonts-dejavu-core \
        fonts-liberation \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY . /var/www/html/

# Serve the same docroot on 8000 too: PDF generation fetches its own URL with
# the browser's host:port, so a container published as host:8000->8000 can
# resolve itself when rootless podman cannot bind privileged port 80.
RUN echo 'Listen 8000' >> /etc/apache2/ports.conf && \
    printf '<VirtualHost *:8000>\n\tDocumentRoot /var/www/html\n\tErrorLog ${APACHE_LOG_DIR}/error.log\n\tCustomLog ${APACHE_LOG_DIR}/access.log combined\n</VirtualHost>\n' \
        >> /etc/apache2/sites-available/000-default.conf

# www-data needs write access for the generated resume.pdf
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80 8000
CMD ["apachectl", "-D", "FOREGROUND"]
