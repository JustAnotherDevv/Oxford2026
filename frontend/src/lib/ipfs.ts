const PINATA_JWT = import.meta.env.VITE_PINATA_JWT as string;

export async function uploadJSON(data: object): Promise<string> {
  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: JSON.stringify({ pinataContent: data }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata upload failed: ${text}`);
  }

  const json = await res.json();
  return json.IpfsHash as string;
}

export async function fetchFromIPFS(cid: string): Promise<object> {
  const res = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch from IPFS: ${res.statusText}`);
  }

  return res.json();
}
