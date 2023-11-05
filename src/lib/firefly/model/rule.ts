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


import { RuleAction } from './rule-action';
import { RuleTrigger } from './rule-trigger';
import { RuleTriggerType } from './rule-trigger-type';

/**
 * 
 * @export
 * @interface Rule
 */
export interface Rule {
    /**
     * 
     * @type {string}
     * @memberof Rule
     */
    created_at?: string;
    /**
     * 
     * @type {string}
     * @memberof Rule
     */
    updated_at?: string;
    /**
     * 
     * @type {string}
     * @memberof Rule
     */
    title: string;
    /**
     * 
     * @type {string}
     * @memberof Rule
     */
    description?: string;
    /**
     * ID of the rule group under which the rule must be stored. Either this field or rule_group_title is mandatory.
     * @type {string}
     * @memberof Rule
     */
    rule_group_id: string;
    /**
     * Title of the rule group under which the rule must be stored. Either this field or rule_group_id is mandatory.
     * @type {string}
     * @memberof Rule
     */
    rule_group_title?: string;
    /**
     * 
     * @type {number}
     * @memberof Rule
     */
    order?: number;
    /**
     * 
     * @type {RuleTriggerType}
     * @memberof Rule
     */
    trigger: RuleTriggerType;
    /**
     * Whether or not the rule is even active. Default is true.
     * @type {boolean}
     * @memberof Rule
     */
    active?: boolean;
    /**
     * If the rule is set to be strict, ALL triggers must hit in order for the rule to fire. Otherwise, just one is enough. Default value is true.
     * @type {boolean}
     * @memberof Rule
     */
    strict?: boolean;
    /**
     * If this value is true and the rule is triggered, other rules  after this one in the group will be skipped. Default value is false.
     * @type {boolean}
     * @memberof Rule
     */
    stop_processing?: boolean;
    /**
     * 
     * @type {Array<RuleTrigger>}
     * @memberof Rule
     */
    triggers: Array<RuleTrigger>;
    /**
     * 
     * @type {Array<RuleAction>}
     * @memberof Rule
     */
    actions: Array<RuleAction>;
}


