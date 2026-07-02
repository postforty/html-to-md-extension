  

이제 [Interactions API](https://ai.google.dev/gemini-api/docs/interactions-overview?hl=ko)가 정식 버전으로 출시되었습니다. 이 API를 사용하여 모든 최신 기능과 모델에 액세스하는 것이 좋습니다.

![](https://ai.google.dev/_static/images/translated.svg?hl=ko) Google uses AI technology to translate content into your preferred language. AI translations can contain errors.

*   [홈](https://ai.google.dev/?hl=ko)
*   [Gemini API](https://ai.google.dev/gemini-api?hl=ko)
*   [문서](https://ai.google.dev/gemini-api/docs?hl=ko)

# Gemini API

모든 신규 프로젝트에는 **Interactions API**를 사용하는 것이 좋습니다. 에이전트형 워크플로, 상태 관리, 최신 모델에 최적화되어 있습니다. [상호작용 API 개요](https://ai.google.dev/gemini-api/docs/interactions-overview?hl=ko)에서 자세히 알아보세요.

Gemini, Veo, Nano Banana 등을 사용하여 프롬프트에서 프로덕션까지 가장 빠르게 도달할 수 있는 경로를 제공합니다.

[Python](https://ai.google.dev/gemini-api/docs?hl=ko#python)[자바스크립트](https://ai.google.dev/gemini-api/docs?hl=ko#%EC%9E%90%EB%B0%94%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8)[REST](https://ai.google.dev/gemini-api/docs?hl=ko#rest) 더보기

```
from google import genai

client = genai.Client()

interaction = client.interactions.create(
    model="gemini-3.5-flash",
    input="Explain how AI works in a few words"
)

print(interaction.output_text)
```

```
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const interaction = await ai.interactions.create({
  model: "gemini-3.5-flash",
  input: "Explain how AI works in a few words",
});

console.log(interaction.output_text);
```

```
curl -X POST "https://generativelanguage.googleapis.com/v1beta/interactions" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "gemini-3.5-flash",
    "input": "Explain how AI works in a few words"
  }'
```

[레고 시작하기](https://ai.google.dev/gemini-api/docs/quickstart?hl=ko)

빠른 시작 가이드에 따라 API 키를 가져오고 몇 분 만에 첫 번째 API 호출을 실행하세요.

* * *

## 모델 살펴보기

[모두 보기](https://ai.google.dev/gemini-api/docs/models?hl=ko)

[

auto\_awesome Gemini 3.1 Pro 신규

최첨단 추론을 기반으로 빌드된 Google의 가장 지능적인 모델로, 멀티모달 이해 능력이 세계 최고 수준입니다.

](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-pro-preview?hl=ko)[

spark Gemini 3.5 Flash 신규

대규모 모델에 필적하는 성능을 훨씬 저렴한 비용으로 제공합니다.

](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash?hl=ko)[

spark Gemini 3.1 Flash-Lite 신규

Gemini 3 시리즈의 성능과 품질을 갖춘 비용에 민감한 대용량 모델입니다.

](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite?hl=ko)[

spark Gemini 3 Flash

대규모 모델에 필적하는 성능을 훨씬 저렴한 비용으로 제공합니다.

](https://ai.google.dev/gemini-api/docs/models/gemini-3-flash-preview?hl=ko)[

🍌 Nano Banana 2 및 Nano Banana Pro

최첨단 이미지 생성 및 편집 모델

](https://ai.google.dev/gemini-api/docs/image-generation?hl=ko)[

video\_library Veo 3.1

네이티브 오디오를 지원하는 최첨단 동영상 생성 모델

](https://ai.google.dev/gemini-api/docs/video?hl=ko)[

spark Gemini Robotics

Gemini의 에이전트 기능을 로보틱스에 적용하고 실제 환경에서 고급 추론을 지원하는 비전 언어 모델 (VLM)입니다.

](https://ai.google.dev/gemini-api/docs/robotics-overview?hl=ko)

## 기능 살펴보기

[

imagesmode

네이티브 이미지 생성 (Nano Banana)

Gemini 2.5 Flash Image를 사용하여 컨텍스트가 풍부한 이미지를 기본적으로 생성하고 편집하세요.



](https://ai.google.dev/gemini-api/docs/image-generation?hl=ko)[

article

긴 컨텍스트

Gemini 모델에 수백만 개의 토큰을 입력하고 비구조화된 이미지, 동영상, 문서에서 이해를 도출하세요.



](https://ai.google.dev/gemini-api/docs/long-context?hl=ko)[

code

구조화된 출력

Gemini가 자동 처리에 적합한 구조화된 데이터 형식인 JSON으로 응답하도록 제한합니다.



](https://ai.google.dev/gemini-api/docs/structured-output?hl=ko)[

functions

함수 호출

Gemini를 외부 API 및 도구에 연결하여 에이전트형 워크플로를 빌드합니다.



](https://ai.google.dev/gemini-api/docs/function-calling?hl=ko)[

videocam

Veo 3.1을 사용한 동영상 생성

최첨단 모델을 사용하여 텍스트 또는 이미지 프롬프트에서 고품질 동영상 콘텐츠를 만드세요.



](https://ai.google.dev/gemini-api/docs/video?hl=ko)[

android\_recorder

Live API를 사용하는 음성 에이전트

Live API를 사용하여 실시간 음성 애플리케이션과 에이전트를 빌드하세요.



](https://ai.google.dev/gemini-api/docs/live?hl=ko)[

build

도구

Google 검색, URL 컨텍스트, Google 지도, 코드 실행, 컴퓨터 사용과 같은 기본 제공 도구를 통해 Gemini를 세상에 연결하세요.



](https://ai.google.dev/gemini-api/docs/tools?hl=ko)[

stacks

문서 이해

최대 1,000페이지의 PDF 파일 또는 기타 텍스트 기반 파일 형식을 완전한 멀티모달 이해로 처리합니다.



](https://ai.google.dev/gemini-api/docs/document-processing?hl=ko)[

cognition\_2

생각 중

사고 능력이 복잡한 작업과 에이전트의 추론을 어떻게 개선하는지 알아봅니다.



](https://ai.google.dev/gemini-api/docs/thinking?hl=ko)

[

Google AI Studio

프롬프트를 테스트하고, API 키를 관리하고, 사용량을 모니터링하고, 프로토타입을 빌드하세요.

](https://aistudio.google.com/?hl=ko)[

group

개발자 커뮤니티

다른 개발자 및 Google 엔지니어에게 질문하고 솔루션을 찾아보세요.

](https://discuss.ai.google.dev/c/gemini-api/4?hl=ko)[

menu\_book

API 참조

공식 참고 문서에서 Gemini API에 관한 자세한 정보를 확인하세요.

](https://ai.google.dev/api?hl=ko)[

sensors

상태

Gemini API, Google AI Studio, 모델 서비스의 상태를 확인하세요.

](https://aistudio.google.com/status?hl=ko)