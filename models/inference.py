import json
import redis
import time
import argparse
from hsg.database.generated import GeneratedTable
import torch
import numpy as np
from denoising_diffusion_pytorch import Unet1D, GaussianDiffusion1D, Trainer1D
from scipy.stats import pearsonr


def consume_message(host, port):
    redis_client = redis.Redis(host=host, port=port, db=0)
    generated_table = GeneratedTable()
    mean = np.array([317.98627087, 316.46883117, 316.79925788, 312.42115028, 313.65862709,
                     304.69814471, 279.6528757, 274.44656772, 271.99888683, 273.05732839,
                     271.2851577, 270.8122449])
    std = np.array([191.90471555, 205.99029385, 207.53214508, 207.07597039, 194.20526881,
                    188.39012924, 193.43415535, 184.83030381, 191.15329791, 200.66722344,
                    201.61039814, 201.42765681])
    model = Unet1D(
        dim=64,
        dim_mults=(1, 2, 4),
        channels=1
    )

    diffusion = GaussianDiffusion1D(
        model,
        seq_length=12,
        timesteps=250,
        objective='pred_v',
        auto_normalize=True,
        mean=mean,
        std=std
    )
    results_folder = './results'
    milestone = '9'
    # data = torch.load(f'{results_folder}/model-{milestone}.pt', map_location='cuda')
    data = torch.load(f'{results_folder}/model-{milestone}.pt', map_location='cpu')
    diffusion.load_state_dict(data['model'])
    # diffusion.cuda()
    print("Running...")
    while True:
        message = redis_client.blpop('generated_queue')
        try:
            if message:
                message = json.loads(message[1].decode('utf-8'))
                prompt_id = message['prompt_id']
                prompt_sequence = []
                with open(f'../csv/{prompt_id}.csv', 'r') as r:
                    for line in r.readlines():
                        if len(line.strip()[:-1]) > 0:
                            prompt_sequence.append(float(line.strip()[:-1]))
                prompt = torch.Tensor(np.array(prompt_sequence))[None, :]
                prompt = prompt.expand(16, 1, 12)
                output = diffusion.sample(batch_size=16, prompt=prompt)
                output = output.cpu()
                for each in output:
                    corr, p_value = pearsonr(each[0], prompt[0][0])
                    generated_sequence = each.numpy().tolist()
                    generated_table.insert_one({
                        'prompt_id': message['prompt_id'],
                        'score': round(corr, 2),
                        'sequence': generated_sequence[0]
                    })
        except Exception as err:
            print(err)
        time.sleep(1)


parser = argparse.ArgumentParser()
parser.add_argument('--config')
args = parser.parse_args()


if __name__ == '__main__':
    with open(args.config, 'r') as r:
        config = json.load(r)
    REDIS_HOST = config.get('REDIS_HOST', 'localhost')
    REDIS_PORT = config.get('REDIS_PORT', 10088)
    consume_message(REDIS_HOST, REDIS_PORT)
