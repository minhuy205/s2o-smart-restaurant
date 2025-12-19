FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["api-gateway.csproj", "."]
RUN dotnet restore "api-gateway.csproj"
COPY . .
RUN dotnet publish "api-gateway.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "api-gateway.dll"]
