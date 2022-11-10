## Updating Directus

1. Update Directus version in package.json and run `yarn`
2. Stop directus container (keep postgres container running)
3. run `yarn start`
4. in another terminal, run `npx directus database migrate:latest`
5. run `yarn snapshot`
6. update Directus version in Dockerfile
7. Rebuild and run with docker-compose
