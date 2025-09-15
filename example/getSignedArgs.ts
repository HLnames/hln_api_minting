// Requires env var API_KEY.
export const getSingleSignedLabel = async () => {
    const apiKey = process.env.API_KEY as string;
    const label = 'examplename';
    const response = await fetch(
        'https://api.testnet.hlnames.xyz/private/sign_mintpass/',
        {
            method: 'POST',
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ label })
        }
    );

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    // minter_args types: {label: string, sig: string, timestamp: number, tierFee: number, referral_hash: string}
    const minter_args = await response.json();
    if (minter_args.sig === undefined) {
        throw new Error("Failed to get signature.");
    }
    else {
        return minter_args;
    }
}
