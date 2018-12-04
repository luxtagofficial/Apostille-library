
/**
 * @description - Errors
 * @export
 * @enum {number}
 */
export enum Errors {

  MISSING_ENDPOINT_ARGUMENT,

  MIJIN_ENDPOINT_NEEDED,

  MISSING_IS_COMPLETE_ARGUMENT,

  NETWORK_TYPE_MISMATCHED,

  APOSTILLE_ALREADY_CREATED,

  APOSTILLE_NOT_CREATED,

  AGGREGATE_COMPLETE_NEED_MULTISIG_ACCOUNT,

  AGGREGATE_BONDED_NEED_MULTISIG_ACCOUNT,

  FILE_ALREADY_ANNOUNCED,

  TRANSACTION_INFO_NOT_FOUND,

  NOT_PUBLIC_APOSTILLE,

  NOT_PRIVATE_APOSTILLE,

  NOT_APOSTILLE,

  CREATION_TRANSACTIONS_NOT_FOUND,

  UNABLE_TO_SIGN_AGGREGATE_TRANSACTION,

  INITIATOR_TYPE_ACCOUNT_REQUIRE_ACCOUNT,

  INITIATOR_TYPE_MULTISIG_REQUIRE_MULTISIG_INITIATOR,

  INITIATOR_TYPE_MULTISIG_REQUIRE_AT_LEAST_ONE_COSIGNER,

  INITIATOR_NOT_COMPLETE,

  INITIATOR_UNABLE_TO_SIGN,

}
