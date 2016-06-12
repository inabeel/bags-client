FROM microsoft/dotnet

COPY server /app
WORKDIR /app
RUN dotnet restore

COPY css /app/client/css
COPY fonts /app/client/fonts
COPY images /app/client/images
COPY img /app/client/img
COPY js /app/client/js
COPY less /app/client/less
COPY media /app/client/media
COPY scripts /app/client/scripts
COPY vendors /app/client/vendors
COPY index.html /app/client/index.html

EXPOSE 80

ENTRYPOINT ["dotnet", "run"]
