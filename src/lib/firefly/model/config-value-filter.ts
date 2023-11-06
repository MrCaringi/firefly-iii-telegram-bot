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
 * Title of the configuration value.
 * @export
 * @enum {string}
 */

export enum ConfigValueFilter {
    ConfigurationIsDemoSite = 'configuration.is_demo_site',
    ConfigurationPermissionUpdateCheck = 'configuration.permission_update_check',
    ConfigurationLastUpdateCheck = 'configuration.last_update_check',
    ConfigurationSingleUserMode = 'configuration.single_user_mode',
    FireflyVersion = 'firefly.version',
    FireflyApiVersion = 'firefly.api_version',
    FireflyDefaultLocation = 'firefly.default_location',
    FireflyAccountToTransaction = 'firefly.account_to_transaction',
    FireflyAllowedOpposingTypes = 'firefly.allowed_opposing_types',
    FireflyAccountRoles = 'firefly.accountRoles',
    FireflyValidLiabilities = 'firefly.valid_liabilities',
    FireflyInterestPeriods = 'firefly.interest_periods',
    FireflyEnableExternalMap = 'firefly.enable_external_map',
    FireflyExpectedSourceTypes = 'firefly.expected_source_types',
    AppTimezone = 'app.timezone',
    FireflyBillPeriods = 'firefly.bill_periods',
    FireflyCreditCardTypes = 'firefly.credit_card_types',
    FireflyLanguages = 'firefly.languages',
    FireflyValidViewRanges = 'firefly.valid_view_ranges'
}



