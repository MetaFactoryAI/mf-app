## Updating Directus

1. Update Directus version in package.json
2. run `yarn start`
3. in another terminal, run `npx directus database migrate:latest`
4. run `yarn snapshot`
5. update Directus version in Dockerfile
6. Rebuild and run with docker-compose
