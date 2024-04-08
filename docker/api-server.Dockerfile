FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src
COPY ./api-server .

# Build production release for Web project
WORKDIR /src/Web
RUN dotnet publish -o build

# This should be using the plain aspnet runtime image
# but logs used to be buggy without the sdk installed (?)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS runtime

WORKDIR /app
COPY --from=build /src/private-key.pem /src/.env .
COPY --from=build /src/Web/build ./web/

WORKDIR /app/web
CMD [ "dotnet", "Web.dll" ]

