/* tslint:disable */
/* eslint-disable */
/**
 * Firefly III API v2.0.10
 * This is the documentation of the Firefly III API. You can find accompanying documentation on the website of Firefly III itself (see below). Please report any bugs or issues. You may use the \"Authorize\" button to try the API below. This file was last generated on 2023-10-15T12:13:25+00:00  Please keep in mind that the demo site does not accept requests from curl, colly, wget, etc. You must use a browser or a tool like Postman to make requests. Too many script kiddies out there, sorry about that. 
 *
 * The version of the OpenAPI document: 2.0.10
 * Contact: james@firefly-iii.org
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */



/**
 * 
 * @export
 * @interface AutocompleteAccount
 */
export interface AutocompleteAccount {
    /**
     * 
     * @type {string}
     * @memberof AutocompleteAccount
     */
    id: string;
    /**
     * Name of the account found by an auto-complete search.
     * @type {string}
     * @memberof AutocompleteAccount
     */
    name: string;
    /**
     * Asset accounts and liabilities have a second field with the given date\'s account balance.
     * @type {string}
     * @memberof AutocompleteAccount
     */
    name_with_balance: string;
    /**
     * Account type of the account found by the auto-complete search.
     * @type {string}
     * @memberof AutocompleteAccount
     */
    type: string;
    /**
     * ID for the currency used by this account.
     * @type {string}
     * @memberof AutocompleteAccount
     */
    currency_id: string;
    /**
     * Currency name for the currency used by this account.
     * @type {string}
     * @memberof AutocompleteAccount
     */
    currency_name: string;
    /**
     * Currency code for the currency used by this account.
     * @type {string}
     * @memberof AutocompleteAccount
     */
    currency_code: string;
    /**
     * Currency symbol for the currency used by this account.
     * @type {string}
     * @memberof AutocompleteAccount
     */
    currency_symbol: string;
    /**
     * Number of decimal places for the currency used by this account.
     * @type {number}
     * @memberof AutocompleteAccount
     */
    currency_decimal_places: number;
}


