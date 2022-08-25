/* eslint-disable */

module.exports = {
  async up(knex) {
    // add default USD, ETH for currencies
    await knex('currencies').insert({ currency: 'USD' });
    await knex('currencies').insert({ currency: 'ETH' });

    const priceCurrencies = await knex('price_currencies');
    const products = await knex('products').whereNotNull('price');
    const currencies = await knex('currencies');

    const getThingByKey = (things, key, value) => {
      for (let i = 0; i < things.length; i++) {
        if (value === things[i][key]) {
          return things[i];
        }
      }
      return null;
    };

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      // get price currency for product
      const priceCurrency = getThingByKey(
        priceCurrencies,
        'id',
        product?.price,
      );
      // corresponding values to update
      const sale_price = priceCurrency?.amount;
      const sale_currency = getThingByKey(
        currencies,
        'currency',
        priceCurrency?.currency,
      );
      if (sale_price && sale_currency) {
        await knex('products')
          .where({ id: product?.id })
          .update({ sale_price, sale_currency: sale_currency?.id });
      }
    }
  },

  async down() {
    // do something?
  },
};
