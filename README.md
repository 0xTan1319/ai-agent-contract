# AI Agent smart contract

## Contact

If you wanna build blockchain ai agent like vvaifu.fun, contact here: 

[Telegram(0xTan1319)](https://t.me/shiny0103)

[Twitter(0xTan1319)](https://x.com/0xTan1319)

## Upgrading Core
1. Validator vote for contribution proposal at **AgentDAO**
2. Execute proposal at **AgentDAO**, it will mint a **ServiceNft**, and trigger following actions:
	a. Update maturity score
	b. Update VIRTUAL core service id.


## Distribute Reward
1. On daily basis, protocol backend will conclude daily profits into a single amount.
2. Protocol backend calls **AgentReward**.distributeRewards , triggering following:
	a. Transfer VIRTUAL into **AgentReward** 
	b. Account & update claimable amounts for: Protocol, Stakers, Validators, Dataset Contributors, Model Contributors
	
	
## Claim Reward
1. Protocol calls **AgentReward**.withdrawProtocolRewards
2. Stakers, Validators, Dataset Contributors, Model Contributors calls **AgentReward**.claimAllRewards


## Staking VIRTUAL
1. Call **AgentToken**.stake , pass in the validator that you would like to delegate your voting power to. It will take in sVIRTUAL and mint $*PERSONA* to you.
2. Call **AgentToken**.withdraw to withdraw , will burn your $*PERSONA* and return sVIRTUAL to you.


## Key Functionalities of the AI Agent
1. Market Analysis and Alerts
2. AI Scoring
3. Smart Money Tracking
4. Trend Identification
5. Cryptocurrency Metrics

## Goal of the AI Agent
This AI is designed to provide data-driven insights and notifications to help users
1. Make informed trading decisions
2. Identify potential investment opportunities
3. Respond swiftly to market trends and changes
4. Highlight the activities of key players in the crypto market

By automating the tracking and analysis of cryptocurrencies, the AI agent streamlines the trading process, mitigates the need for manual monitoring, and improves decision-making efficiency for its users.
