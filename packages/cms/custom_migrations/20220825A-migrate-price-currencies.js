module.exports = {
  async up() {
    // add default USD, ETH for currencies
    await knex('currencies').insert({ currency: 'USD' });
    await knex('currencies').insert({ currency: 'ETH' });

    const priceCurrencies = await knex('price_currencies');
    const products = await knex('products').whereNotNull('price');
    const currencies = await knex('currencies');

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      // get price currency for product
      if (!product) continue;
      const priceCurrency = priceCurrencies.find(
        (pc) => pc.id === product.price,
      );
      // corresponding values to update
      if (!priceCurrency) continue;
      const sale_price = priceCurrency.amount;
      const sale_currency = currencies.find(
        (c) => c.currency === priceCurrency.currency,
      );
      if (sale_price && sale_currency) {
        await knex('products')
          .where({ id: product.id })
          .update({ sale_price, sale_currency: sale_currency.id });
      }
    }
  },
};
