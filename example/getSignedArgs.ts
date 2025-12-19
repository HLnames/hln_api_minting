import { normalize } from 'viem/ens'

// Requires env var API_KEY.
export const getSingleSignedLabel = async () => {
    const apiKey = process.env.API_KEY as string;
    const label = 'examplename';

    // Fail early if label cannot be normalized
    try {
        const normalizedLabel = normalize(label);
        const response = await fetch(
            'https://api.testnet.hlnames.xyz/private/sign_mintpass/' + normalizedLabel,
            {
                method: 'POST',
                headers: {
                    'X-API-Key': apiKey,
                    'Content-Type': 'application/json'
                },
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // minter_args types: {label: string, sig: string, timestamp: number, amountRequired: string}
        const minter_args = await response.json();
        if (minter_args.sig === undefined) {
            throw new Error("Failed to get signature.");
        }
        else {
            return minter_args;
        }
    } catch (error) {
        console.error(`Error normalizing label, abort: ${error}`);
    }
}
