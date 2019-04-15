
/**
 * @description - Errors
 * @export
 * @enum {number}
 */
export enum Errors {
  AGGREGATE_BONDED_NEED_MULTISIG_ACCOUNT,
  AGGREGATE_COMPLETE_NEED_MULTISIG_ACCOUNT,
  APOSTILLE_ALREADY_CREATED,
  APOSTILLE_NOT_CREATED,
  CREATION_TRANSACTIONS_NOT_FOUND,
  FILE_ALREADY_ANNOUNCED,
  INITIATOR_NOT_COMPLETE,
  INITIATOR_TYPE_ACCOUNT_REQUIRE_ACCOUNT,
  INITIATOR_TYPE_MULTISIG_REQUIRE_AT_LEAST_ONE_COSIGNER,
  INITIATOR_TYPE_MULTISIG_REQUIRE_MULTISIG_INITIATOR,
  INITIATOR_UNABLE_TO_SIGN,
  MIJIN_ENDPOINT_NEEDED,
  MISSING_ENDPOINT_ARGUMENT,
  MISSING_IS_COMPLETE_ARGUMENT,
  NETWORK_TYPE_MISMATCHED,
  NETWORK_TYPE_NOT_SUPPORTED,
  NOT_APOSTILLE,
  NOT_PRIVATE_APOSTILLE,
  NOT_PUBLIC_APOSTILLE,
  TRANSACTION_INFO_NOT_FOUND,
  UNABLE_TO_SIGN_AGGREGATE_TRANSACTION,
}
