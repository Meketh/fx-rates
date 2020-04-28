## fx-rates

### Development

It should work fine just running `docker-compose up` but `parcel serve`'s `WebSocket`
don't play well with the container so you can `npm run dev:client` at the same time
to get `HMR`

### Deploy

To deploy just push to master. Make sure you use the `production` build with `npm start`
