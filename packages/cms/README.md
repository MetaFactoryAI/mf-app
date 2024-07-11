## Updating Directus

1. Update Directus version in package.json and run `yarn`
2. Stop directus container (keep postgres container running)
3. run `yarn start` (in this folder / package)
4. in another terminal, run `npx directus database migrate:latest`
5. run `yarn snapshot`
6. update Directus version in Dockerfile
7. Rebuild and run with docker-compose

## Updating Datamodel

1. Run CMS stack with docker-compose `yarn docker:cms:start`
2. Open Directus admin panel at `http://localhost:8055/admin`
3. Login with admin email and password from `.env`
4. Make changes to datamodel in Directus admin panel at `http://localhost:8055/admin/settings/data-model`
5. Run `yarn snapshot` to save changes to the datamodel to source control
6. Commit `snapshot.yaml` and open a PR to sync changes to production

## Fixing errors on ARM computers (M1 Macs)

If you get an error like this for a package: `mach-o file, but is an incompatible architecture (have 'x86_64', need 'arm64e')`

You can run this command to fix it: `npm rebuild argon2 --build-from-source`
