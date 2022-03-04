import React, { useEffect, useState } from 'react';

import { getHypothesisToken, validateSaveToken } from '../common/storage';

function OptionsPage({}) {
	const [token, setToken] = useState('');
	useEffect(async () => {
		setToken(await getHypothesisToken());
	}, []);
	async function onChangeToken(newToken) {
		setToken(newToken);
		await validateSaveToken(newToken, true);
	}

	return (
		<div>
			<h3>Hypothes.is Authentication</h3>
			<div className="text-input">
				<label class="text-input">
					<a
						className="underline"
						href="https://hypothes.is/account/developer"
						target="_blank"
						rel="noopener noreferrer"
						style={{ marginRight: '1em' }}
					>
						API token
					</a>
				</label>
				<input
					type="text"
					style={{ width: '300px' }}
					spellCheck="false"
					value={token}
					onChange={(e) => onChangeToken(e.target.value)}
				/>
			</div>
		</div>
	);
}
export default OptionsPage;
