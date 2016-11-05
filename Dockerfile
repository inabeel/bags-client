FROM zoltu/aspnetcore-gulp-bower

RUN npm install -g handlebars

COPY Startup.cs /app/
COPY Controllers/ /app/Controllers/
COPY project.json /app/
COPY project.lock.json /app/

WORKDIR /app
RUN dotnet restore
RUN dotnet build

COPY client /app/client

RUN handlebars /app/client/scripts/templates/ --output /app/client/scripts/templates/template.min.js --map

EXPOSE 80

ENTRYPOINT ["dotnet", "run"]
