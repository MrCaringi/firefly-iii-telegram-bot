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


import { RecurrenceRepetitionUpdate } from './recurrence-repetition-update';
import { RecurrenceTransactionUpdate } from './recurrence-transaction-update';

/**
 * 
 * @export
 * @interface RecurrenceUpdate
 */
export interface RecurrenceUpdate {
    /**
     * 
     * @type {string}
     * @memberof RecurrenceUpdate
     */
    title?: string;
    /**
     * Not to be confused with the description of the actual transaction(s) being created.
     * @type {string}
     * @memberof RecurrenceUpdate
     */
    description?: string;
    /**
     * First time the recurring transaction will fire.
     * @type {string}
     * @memberof RecurrenceUpdate
     */
    first_date?: string;
    /**
     * Date until the recurring transaction can fire. After that date, it\'s basically inactive. Use either this field or repetitions.
     * @type {string}
     * @memberof RecurrenceUpdate
     */
    repeat_until?: string | null;
    /**
     * Max number of created transactions. Use either this field or repeat_until.
     * @type {number}
     * @memberof RecurrenceUpdate
     */
    nr_of_repetitions?: number | null;
    /**
     * Whether or not to fire the rules after the creation of a transaction.
     * @type {boolean}
     * @memberof RecurrenceUpdate
     */
    apply_rules?: boolean;
    /**
     * If the recurrence is even active.
     * @type {boolean}
     * @memberof RecurrenceUpdate
     */
    active?: boolean;
    /**
     * 
     * @type {string}
     * @memberof RecurrenceUpdate
     */
    notes?: string | null;
    /**
     * 
     * @type {Array<RecurrenceRepetitionUpdate>}
     * @memberof RecurrenceUpdate
     */
    repetitions?: Array<RecurrenceRepetitionUpdate>;
    /**
     * 
     * @type {Array<RecurrenceTransactionUpdate>}
     * @memberof RecurrenceUpdate
     */
    transactions?: Array<RecurrenceTransactionUpdate>;
}


