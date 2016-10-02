FROM zoltu/aspnetcore-gulp-bower

RUN npm install -g handlebars

COPY server /app
WORKDIR /app
RUN dotnet restore
RUN dotnet build

COPY css /app/client/css
COPY fonts /app/client/fonts
COPY img /app/client/img
COPY js /app/client/js
COPY scripts /app/client/scripts
COPY vendors /app/client/vendors
COPY index.html /app/client/index.html

RUN handlebars /app/client/scripts/templates/ --output /app/client/scripts/templates/template.min.js --map

EXPOSE 80

ENTRYPOINT ["dotnet", "run"]
