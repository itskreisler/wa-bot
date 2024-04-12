from argparse import ArgumentParser
import requests
from typing import Match, Literal, TypedDict, List
from datetime import datetime
from tqdm import tqdm
import re, html, json, os, sys
import json
import subprocess


def reducir_tamanhio_video(input_path: str = None, output_path: str = None):
    # user ffmpeg to reduce video size
    # ffmpeg -i {input_path} -qscale 0 output_{input_path}
    command = f"ffmpeg -i {input_path} -qscale 0 {output_path}"
    result = subprocess.run(command.split(), stdout=subprocess.PIPE)
    print(result.stdout.decode())


#
class Quality(TypedDict):
    name: Literal["mobile", "lowest", "low", "sd", "hd"]
    url: str
    seekSchema: int
    disallowed: bool


class Videos(TypedDict):
    videos: List[Quality]


class Metadata(TypedDict):
    metadata: Videos
    asas: str


class OKRU(TypedDict):
    flashvars: Metadata


# tempFileName = datetime.now().strftime("%Y%m%d%H%M%S")


def download_video(url, filename):
    response = requests.get(url, stream=True)
    total_size = int(response.headers.get("content-length", 0))
    progress_bar = tqdm(total=total_size, unit="B", unit_scale=True)
    with open(filename, "wb") as f:
        for chunk in response.iter_content(chunk_size=1024):
            if chunk:
                f.write(chunk)
                progress_bar.update(len(chunk))
    progress_bar.close()


if "termux" in sys.prefix:
    try:
        os.system("termux-setup-storage")
    except:
        pass
    dir = "/sdcard/OK-RU"
else:
    dir = "OK-RU"
try:
    os.mkdir(dir)
except:
    pass


class OkRuDl:
    def __init__(self, video_url, filename):
        self.url = video_url
        self.filename = filename

    @property
    def download(self):
        r = requests.get(
            self.url,
            headers={
                "User-agent": "Mozilla/5.0 (Linux; Android 9; Redmi Note 5A) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Mobile Safari/537.36"
            },
        )
        v: Match = re.search(r"data\-options\=\"(.*?)\"", r.text).group(1)
        data: OKRU = json.loads(html.unescape(v))
        # cadena_json = json.dumps(data, indent=2)
        flashvars = data["flashvars"]
        metadata: Videos = json.loads(flashvars["metadata"])
        videos: List[Quality] = metadata["videos"]

        # print(json.dumps(videos, indent=2))
        # Acceder al último elemento
        ultimo_elemento: Quality = videos[-1]

        # Acceder al primer elemento
        primer_elemento: Quality = videos[0]
        """ 
            url: str
              for video in videos:
                if video['name'] == 'lowest':
                    video_url = video['url']
                    print(f"Video URL: {video_url}")
                    url = video_url
                    break     """
        video_title = self.filename
        url = ultimo_elemento["url"]
        final_path = f"{dir}/{video_title}.mp4"
        min_path = f"{dir}/{video_title}_min.mp4"
        download_video(url, final_path)
        print(
            f"\nVideo successfully downloaded.\nVideo saved to \033[92m{final_path}\033[0m\033[0m"
        )
        print("Reducing video size...")
        reducir_tamanhio_video(input_path=final_path, output_path=min_path)
        print(f"Video saved to \033[92m{min_path}\033[0m\033[0m")


def main():
    parser = ArgumentParser(description="Download video from ok.ru.")
    # URL
    parser.add_argument(
        "-u", "--url", type=str, help="URL of the video.", dest="url", metavar="URL"
    )
    # filename
    parser.add_argument(
        "-f",
        "--filename",
        type=str,
        help="Name of the file to save the video.",
        dest="filename",
        metavar="FILENAME",
    )
    args = parser.parse_args()
    if args.url is None or args.filename is None:
        parser.print_help()
        raise SystemExit(1)
    ok = OkRuDl(args.url, args.filename)
    ok.download


if __name__ == "__main__":
    os.system("clear")
    main()
