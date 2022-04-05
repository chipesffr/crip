<template>
    <div>
        <b-container fluid class="container-top bg-primary">
            <b-row>
                <b-col class="d-flex justify-content-center">
                    <b-media>
                        <template #aside>
                            <IconCrypto coinname color="color" format="svg" width="80"/>
                        </template>
                        <h2 class="text-light title">Cryptocurrencies</h2>
                        <p class="text-light mb-0">
                            Search and retrieve market value information of Cryptocurrencies using coinbase API
                        </p>
                    </b-media>
                </b-col>
            </b-row>
        </b-container>
        <b-container fluid class="container-bottom">
            <b-row class="mb-4">
                <b-col class="d-flex justify-content-end pr-4">
                    <vue-autosuggest ref="suggestionsCurrencies" class="suggestions-currencies" v-model="queryCurrencies" :suggestions="suggestionsCurrencies" :input-props="propsInputCurrencies" @input="filterSuggestedCurrencies()" @selected="selectedCurrency" :shouldRenderSuggestions="(size, loading) => !loading">
                        <template slot-scope="{ suggestion }">
                            <b-icon icon="check" v-if="suggestion.item.selected"/>
                            {{ `${suggestion.item.name} (${suggestion.item.symbol})` }}
                        </template>
                        <template #after-suggestions v-if="suggestionsCurrencies[0].data.length === 0">
                            <div class="autosuggest__empty">
                                No results for "{{ queryCurrencies }}"
                            </div>
                        </template>
                    </vue-autosuggest>
                </b-col>
            </b-row>
            <b-row align-h="center">
                <template v-if="currencies.length > 0">
                    <b-col v-for="(currency, i) in currencies" :key="i" xl="3" lg="4" md="6" sm="12">
                        <b-skeleton-wrapper :loading="currency.loading">
                            <template #loading>
                                <b-card>
                                    <b-media>
                                        <template #aside>
                                            <b-skeleton type="avatar" size="65"></b-skeleton>
                                        </template>
                                        <b-skeleton width="60%" height="1.75rem" class="mb-2"></b-skeleton>
                                        <b-skeleton width="40%" height="1.25rem"></b-skeleton>
                                    </b-media>
                                </b-card>
                            </template>
                            <b-card class="mb-3">
                                <b-media>
                                    <template #aside>
                                        <IconCrypto :coinname="currency.symbol" color="color" format="svg" width="60"/>
                                    </template>
                                    <h3 class="mb-1">
                                        <b-link :href="hrefCurrency(currency.name)" target="_blank" class="text-primary" v-b-tooltip.hover title="Go to coinbase website">
                                            {{ currency.name }}
                                        </b-link>
                                    </h3>
                                    <h5 class="text-muted mb-0">
                                        {{ currency.value | currency }}
                                    </h5>
                                </b-media>
                            </b-card>
                            <b-button class="button-remove bg-danger bg-darken-1" @click="removeCurrency(i)">
                                ×
                            </b-button>
                        </b-skeleton-wrapper>
                    </b-col>
                </template>
                <template v-else>
                    <b-col cols="auto" class="text-center">
                        <b-card class="mb-0 px-1 px-sm-4">
                            <h5 class="brand-text text-primary m-0">
                                No currency selected, search for a new currency
                            </h5>
                        </b-card>
                    </b-col>
                </template>
            </b-row>
        </b-container>
    </div>
</template>

<script>
import axios from 'axios';
import { VueAutosuggest } from 'vue-autosuggest';
import Swal from 'sweetalert2';
import 'sweetalert2/src/sweetalert2.scss';

export default {
    components: {
        VueAutosuggest,
    },
    filters: {
        currency(value) {
            return Number(value).toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 2,
            });
        },
    },
    data() {
        return {
            currenciesInfo: [],
            currencies: [],
            queryCurrencies: '',
            timeout: null,
            suggestionsCurrencies: [
                {
                    data: [],
                },
            ],
            propsInputCurrencies: {
                class: 'form-control',
                placeholder: 'Search Coin Name',
            },
        };
    },
    methods: {
        setDefaultCurrenciesSuggestion() {
            this.suggestionsCurrencies = [
                {
                    data: this.currenciesInfo,
                },
            ];
        },
        setSelectedCurrency(symbol) {
            const index = this.suggestionsCurrencies[0].data.findIndex((data) => data.symbol === symbol);

            this.suggestionsCurrencies[0].data[index].selected = !this.suggestionsCurrencies[0].data[index].selected;
        },
        filterSuggestedCurrencies() {
            clearTimeout(this.timeout);

            if (this.queryCurrencies) {
                this.timeout = setTimeout(() => {
                    const currencies = this.currenciesInfo.filter((data) => data.name.toLowerCase().indexOf(this.queryCurrencies.toLowerCase()) > -1);

                    this.suggestionsCurrencies = [
                        {
                            data: currencies,
                        },
                    ];
                }, 300);
            } else {
                this.setDefaultCurrenciesSuggestion();
            }
        },
        hrefCurrency(currency) {
            if (currency === undefined) {
                return '';
            }

            return `https://www.coinbase.com/price/${currency.toLowerCase().replaceAll(' ', '-')}`;
        },
        getCurrencyValue(currency) {
            const { name, symbol } = currency;

            const index = this.currencies.push({
                loading: true,
            });

            // https://developers.coinbase.com/api/v2#get-spot-price
            axios.get(`https://api.coinbase.com/v2/prices/${symbol}-USD/spot`).then(({ data }) => {
                this.$set(this.currencies, index - 1, {
                    loading: false,
                    name,
                    symbol,
                    value: data.data.amount,
                });
            });
        },
        removeCurrency(index) {
            this.setSelectedCurrency(this.currencies[index].symbol);

            this.currencies.splice(index, 1);
        },
        selectedCurrency(suggestion) {
            if (!suggestion) {
                return;
            }

            if (suggestion.item.selected) {
                Swal.fire({
                    title: 'Currency is already selected',
                    icon: 'warning',
                });

                return;
            }

            this.setSelectedCurrency(suggestion.item.symbol);
            this.getCurrencyValue(suggestion.item);

            this.$refs.suggestionsCurrencies.internalValue = '';
            this.queryCurrencies = '';
            this.setDefaultCurrenciesSuggestion();
        },
        getCurrencies() {
            // https://docs.cloud.coinbase.com/exchange/reference/exchangerestapi_getcurrencies
            axios.get('https://api.exchange.coinbase.com/currencies').then((res) => {
                this.currenciesInfo = res.data.map((data) => ({
                    name: data.name,
                    symbol: data.id,
                    selected: false,
                }));

                this.setDefaultCurrenciesSuggestion();
            });
        },
    },
    created() {
        this.getCurrencies();
    },
};
</script>

<style lang="scss">
.container-top {
    padding-top: 3rem;
    padding-bottom: 7rem;
}

.container-bottom {
    margin-top: -6rem;

    .suggestions-currencies {
        width: 475px;
    }

    .button-remove {
        position: absolute;
        line-height: 1;
        top: -5px;
        right: 13px;
        font-size: 1.3rem;
        box-shadow: 0 3px 8px 0 rgb(11 10 25 / 49%) !important;
        padding: 0.4rem 0.6rem;
        border-radius: 0.357rem;
        transform: translate(8px, -2px);
        transition: all 0.23s ease 0.1s;
        border-radius: 0.357rem;
        border: 0;

        &:hover,
        &:focus,
        &:active {
            transform: translate(5px, 3px);
        }
    }
}

@media only screen and (max-width: 425px) {
    .container, .container-fluid, .container-xl, .container-lg, .container-md, .container-sm {
        padding-right: 10px !important;
        padding-left: 10px !important;
    }

    .title {
        font-size: 1.5rem;
    }
}
</style>