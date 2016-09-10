FROM zoltu/aspnetcore-gulp-bower

RUN npm install -g handlebars

COPY server /app
WORKDIR /app
RUN dotnet restore
RUN dotnet build

COPY css /app/client/css
COPY fonts /app/client/fonts
COPY images /app/client/images
COPY img /app/client/img
COPY js /app/client/js
COPY less /app/client/less
COPY scripts /app/client/scripts
COPY vendors /app/client/vendors
COPY index.html /app/client/index.html
COPY about.html /app/client/about.html

RUN handlebars /app/client/scripts/templates/ --output /app/client/scripts/templates/lc_template-min.js --map

EXPOSE 80

ENTRYPOINT ["dotnet", "run"]
