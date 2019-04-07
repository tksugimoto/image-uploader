/* global AWS */

document.querySelectorAll('.setting').forEach(settingInput => {
	const key = settingInput.id;
	chrome.storage.local.get({
		[key]: '',
	}, items => {
		settingInput.value = items[key];
	});
	settingInput.title = 'Enterで保存';
	settingInput.addEventListener('keyup', evt => {
		if (evt.key === 'Enter') {
			chrome.storage.local.set({
				[key]: settingInput.value,
			});
		}
	});
});

const upload = file => {
	const fileExt = file.type.replace(/^image\//, '');
	const key = `${Date.now()}.${fileExt}`;
	return new Promise((resolve, reject) => {
		chrome.storage.local.get([
			'endpoint',
			'user-name',
			'secret-access-key',
		], items => {
			const endpoint = items['endpoint'];
			const userName = items['user-name'];
			const secretAccessKey = items['secret-access-key'];
			const bucketName = userName;

			const minio  = new AWS.S3({
				accessKeyId: userName,
				secretAccessKey,
				endpoint,
				s3ForcePathStyle: true,
				signatureVersion: 'v4',
			});

			minio.putObject({
				Bucket: bucketName,
				Key: key,
				ContentType: file.type,
				Body: file,
			}, (err) => {
				if (err) {
					reject(err);
				} else {
					const url = `${endpoint}/${bucketName}/${key}`;
					resolve(url);
				}
			});
		});
	});
};


// TODO: fileを選択してアップロード
// TODO: fileをドラッグ・アンド・ドロップしてアップロード

document.getElementById('input').addEventListener('paste', evt => {
	evt.preventDefault();
	const clipboardData = evt.clipboardData;
	Array.from(clipboardData.items).forEach(item => {
		const kind = item.kind;
		const type = item.type;

		if (kind === 'file') {
			if (type.startsWith('image/')) {
				const file = item.getAsFile();

				upload(file).then(url => {
					// TODO: URLのコピーボタン追加（or自動コピー）
					// TODO: ファイルの削除ボタン追加
					const preview = document.getElementById('preview');
					preview.innerText = url;
					preview.append(document.createElement('br'));
					const img = document.createElement('img');
					img.src = url;
					preview.append(img);
				}).catch(console.error);
			}
		}
	});
});
