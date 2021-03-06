import React, { useContext, useState } from 'react';
import Styled from 'styled-components';
import BN from 'bn.js';
import { Address, Button } from '@mycrypto/ui';

import feeIcon from 'common/assets/images/icn-fee.svg';
import sendIcon from 'common/assets/images/icn-send.svg';
import walletIcon from 'common/assets/images/icn-wallet.svg';
import { AddressBookContext } from 'v2/services/Store';
import { Amount, AssetIcon } from 'v2/components';
import { fromWei, Wei, totalTxFeeToString, totalTxFeeToWei } from 'v2/services/EthService';
import { RatesContext } from 'v2/services/RatesProvider';
import { IStepComponentProps } from 'v2/types';
import { BREAK_POINTS } from 'v2/theme';

import TransactionDetailsDisplay from './displays/TransactionDetailsDisplay';
import TransactionIntermediaryDisplay from './displays/TransactionIntermediaryDisplay';
import { convertToFiat, truncate } from 'v2/utils';
import translate from 'v2/translations';
import { TSymbol } from 'v2/types/symbols';
const { SCREEN_XS } = BREAK_POINTS;

const ConfirmTransactionWrapper = Styled.div`
  text-align: left;
`;

const RowWrapper = Styled.div<{ stack?: boolean }>`
  display: flex;
  margin-bottom: 24px;
  flex-direction: ${props => (props.stack ? 'column' : 'row')};
  @media (min-width: ${SCREEN_XS}) {
    flex-direction: row;
    align-items: center;
  }
`;

const ColumnWrapper = Styled.div<{ bold?: boolean }>`
  font-size: 16px;
  flex: 1;
  font-weight: ${props => (props.bold ? 'bold' : 'normal')};
  @media (min-width: ${SCREEN_XS}) {
    margin-bottom: 0;
  }
  @media (min-width: ${SCREEN_XS}) {
    font-size: 18px;
  }
  img {
    width: 30px;
    height: 30px;
    margin-right: 10px;
  }
`;

const AddressWrapper = Styled(ColumnWrapper)<{ position: string }>`
  font-size: 16px;
  & > div {
    margin: 10px 0 10px 0;
    padding: 12px;
    background: #f8f8f8;
    font-size: 16px;
  }
  @media (min-width: ${SCREEN_XS}) {
    margin: 0 10px 0 10px;
    ${props => `margin-${props.position}: 0;`}
  }

  // Ensure that label and address are stacked vertically
  & > div > div {
    display: flex;
    flex-direction: column;
  }
}
`;

const AmountWrapper = Styled(ColumnWrapper)`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: flex-start;
  img {
    display: none;
    @media (min-width: ${SCREEN_XS}) {
      margin-right: 10px;
      display: block;
    }
  }
`;

const Divider = Styled.div`
  height: 1px;
  margin-bottom: 20px;
  background: #e3edff;
`;

const SendButton = Styled(Button)`
  width: 100%;
`;

export default function ConfirmTransaction({
  txConfig,
  onComplete,
  signedTx
}: IStepComponentProps) {
  const { getContactByAccount, getContactByAddressAndNetwork } = useContext(AddressBookContext);
  const [isBroadcastingTx, setIsBroadcastingTx] = useState(false);
  const handleApprove = () => {
    setIsBroadcastingTx(true);
    onComplete(null);
  };

  const { getAssetRate } = useContext(RatesContext);
  const recipientContact = getContactByAddressAndNetwork(
    txConfig.receiverAddress,
    txConfig.network
  );
  const recipientLabel = recipientContact ? recipientContact.label : 'Unknown Address';

  const {
    asset,
    gasPrice,
    gasLimit,
    value,
    amount,
    senderAccount,
    receiverAddress,
    network,
    nonce,
    data,
    baseAsset
  } = txConfig;
  const assetType = asset.type;

  /* Calculate Transaction Fee */
  const transactionFeeWei: BN = totalTxFeeToWei(gasPrice, gasLimit);
  const maxTransactionFeeBase: string = totalTxFeeToString(gasPrice, gasLimit);

  /* Calculate total base asset amount */
  const valueWei = Wei(value);
  const totalEtherEgress = parseFloat(fromWei(valueWei.add(transactionFeeWei), 'ether')).toFixed(6); // @TODO: BN math, add amount + maxCost !In same symbol

  /* Determing User's Contact */
  const senderContact = getContactByAccount(senderAccount);
  const senderAccountLabel = senderContact ? senderContact.label : 'Unknown Account';

  /* Get Rates */
  const assetRate = getAssetRate(asset);
  const baseAssetRate = getAssetRate(baseAsset);

  return (
    <ConfirmTransactionWrapper>
      <RowWrapper stack={true}>
        <AddressWrapper position={'left'}>
          {translate('CONFIRM_TX_FROM')}
          <Address
            address={senderAccount ? senderAccount.address : 'Unknown'}
            title={senderAccountLabel}
            truncate={truncate}
          />
        </AddressWrapper>
        <AddressWrapper position={'right'}>
          {translate('CONFIRM_TX_TO')}
          <Address
            address={receiverAddress || 'Unknown'}
            title={recipientLabel}
            truncate={truncate}
          />
        </AddressWrapper>
      </RowWrapper>
      {assetType === 'erc20' && (
        <RowWrapper>
          <TransactionIntermediaryDisplay asset={asset} />
        </RowWrapper>
      )}
      <RowWrapper>
        <ColumnWrapper>
          <img src={sendIcon} alt="Send" /> {translate('CONFIRM_TX_SENDING')}
        </ColumnWrapper>
        <AmountWrapper>
          <AssetIcon symbol={asset.ticker as TSymbol} size={'30px'} />
          <Amount
            assetValue={`${parseFloat(amount).toFixed(6)} ${asset.ticker}`}
            fiatValue={`$${convertToFiat(parseFloat(amount), assetRate).toFixed(2)}
          `}
          />
        </AmountWrapper>
      </RowWrapper>
      <RowWrapper>
        <ColumnWrapper>
          <img src={feeIcon} alt="Fee" /> {translate('CONFIRM_TX_FEE')}
        </ColumnWrapper>
        <AmountWrapper>
          <AssetIcon symbol={asset.ticker as TSymbol} size={'30px'} />
          <Amount
            assetValue={`${maxTransactionFeeBase} ${baseAsset.ticker}`}
            fiatValue={`$${convertToFiat(parseFloat(maxTransactionFeeBase), baseAssetRate).toFixed(
              2
            )}`}
          />
        </AmountWrapper>
      </RowWrapper>
      <Divider />
      <RowWrapper>
        <ColumnWrapper bold={true}>
          <img src={walletIcon} alt="Total" />
          {translate('TOTAL')}
        </ColumnWrapper>
        <AmountWrapper>
          {assetType === 'base' ? (
            <>
              <AssetIcon symbol={asset.ticker as TSymbol} size={'30px'} />
              <Amount
                assetValue={`${totalEtherEgress} ${asset.ticker}`}
                fiatValue={`$${convertToFiat(parseFloat(totalEtherEgress), assetRate).toFixed(2)}`}
              />
            </>
          ) : (
            <>
              <AssetIcon symbol={asset.ticker as TSymbol} size={'30px'} />
              <Amount
                assetValue={`${amount} ${asset.ticker}`}
                bold={true}
                baseAssetValue={`+ ${totalEtherEgress} ${baseAsset.ticker}`}
                fiatValue={`$${(
                  convertToFiat(parseFloat(amount), assetRate) +
                  convertToFiat(parseFloat(totalEtherEgress), baseAssetRate)
                ).toFixed(2)}`}
              />
            </>
          )}
        </AmountWrapper>
      </RowWrapper>
      <TransactionDetailsDisplay
        baseAsset={baseAsset}
        asset={asset}
        data={data}
        network={network}
        senderAccount={senderAccount}
        gasLimit={gasLimit}
        gasPrice={gasPrice}
        nonce={nonce}
        signedTransaction={signedTx}
      />
      <SendButton
        onClick={handleApprove}
        disabled={isBroadcastingTx}
        className="ConfirmTransaction-button"
      >
        {isBroadcastingTx ? translate('SUBMITTING') : translate('CONFIRM_AND_SEND')}
      </SendButton>
    </ConfirmTransactionWrapper>
  );
}
