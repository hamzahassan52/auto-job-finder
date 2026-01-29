from anthropic import AsyncAnthropic
from openai import AsyncOpenAI
from app.core.config import settings
from typing import Optional
import json
import httpx


class AIService:
    def __init__(self):
        self.provider = settings.AI_PROVIDER

        if self.provider == "anthropic":
            self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            self.model = "claude-3-sonnet-20240229"
        elif self.provider == "groq":
            # Groq uses OpenAI-compatible API
            self.client = AsyncOpenAI(
                api_key=settings.GROQ_API_KEY,
                base_url="https://api.groq.com/openai/v1",
            )
            self.model = "llama-3.3-70b-versatile"
        else:
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            self.model = "gpt-4-turbo-preview"

    async def _call_llm(self, prompt: str, max_tokens: int = 1024) -> str:
        """Universal LLM call supporting multiple providers."""

        if self.provider == "anthropic":
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.content[0].text
        else:
            # OpenAI / Groq compatible
            response = await self.client.chat.completions.create(
                model=self.model,
                max_tokens=max_tokens,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.choices[0].message.content

    def _parse_json(self, content: str) -> dict:
        """Parse JSON from LLM response."""
        try:
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            return json.loads(content.strip())
        except json.JSONDecodeError:
            return {"raw_content": content}

    async def generate_application_email(
        self,
        job_title: str,
        company_name: str,
        job_description: str,
        job_requirements: list[str],
        user_name: str,
        user_skills: list[str],
        user_experience: str,
        user_current_role: str,
        additional_context: Optional[str] = None,
        resume_text: Optional[str] = None,
    ) -> dict:
        """Generate professional job application email."""

        prompt = f"""Generate a professional job application email for the following:

JOB DETAILS:
- Position: {job_title}
- Company: {company_name}
- Description: {job_description}
- Requirements: {', '.join(job_requirements) if job_requirements else 'Not specified'}

CANDIDATE PROFILE:
- Name: {user_name}
- Current Role: {user_current_role}
- Skills: {', '.join(user_skills) if user_skills else 'Not specified'}
- Experience: {user_experience}
{f"- Resume Summary: {resume_text[:1000]}..." if resume_text else ""}
{f"- Additional Context: {additional_context}" if additional_context else ""}

INSTRUCTIONS:
1. Write a professional, concise email (150-200 words)
2. Highlight relevant skills matching job requirements
3. Show genuine interest in the company
4. Include a clear call-to-action
5. Maintain formal but personable tone
6. Do NOT use generic phrases like "I am writing to express my interest"
7. Make it unique and personalized

Return JSON format:
{{"subject": "email subject line", "body": "email body text"}}"""

        content = await self._call_llm(prompt)
        result = self._parse_json(content)

        if "subject" not in result:
            result = {"subject": f"Application for {job_title} at {company_name}", "body": content}

        return result

    async def generate_email_from_resume(
        self,
        resume_text: str,
        job_description: str,
        user_name: str,
        custom_instructions: Optional[str] = None,
    ) -> dict:
        """Generate email from resume + job description (Option A)."""

        prompt = f"""Analyze the resume and job description, then generate a tailored application email.

RESUME:
{resume_text[:2000]}

JOB DESCRIPTION:
{job_description}

CANDIDATE NAME: {user_name}
{f"CUSTOM INSTRUCTIONS: {custom_instructions}" if custom_instructions else ""}

TASK:
1. Identify matching skills between resume and job requirements
2. Extract relevant experience and achievements
3. Generate a professional email that:
   - Has a compelling subject line
   - Opens with impact (no generic phrases)
   - Highlights 2-3 most relevant qualifications
   - Shows knowledge of the company/role
   - Ends with clear call-to-action

Return JSON:
{{"subject": "subject line", "body": "email body", "matched_skills": ["skill1", "skill2"], "highlights": ["highlight1", "highlight2"]}}"""

        content = await self._call_llm(prompt, max_tokens=1500)
        return self._parse_json(content)

    async def generate_email_from_context(
        self,
        user_name: str,
        context: str,
        job_title: Optional[str] = None,
        company_name: Optional[str] = None,
    ) -> dict:
        """Generate email from custom context/instructions (Option B)."""

        prompt = f"""Generate a professional job application email based on the following context:

CANDIDATE: {user_name}
{f"POSITION: {job_title}" if job_title else ""}
{f"COMPANY: {company_name}" if company_name else ""}

USER'S CONTEXT/INSTRUCTIONS:
{context}

Generate a professional email that follows the user's instructions while maintaining a formal business tone.

Return JSON:
{{"subject": "subject line", "body": "email body"}}"""

        content = await self._call_llm(prompt)
        return self._parse_json(content)

    async def generate_fully_automated_email(
        self,
        job_data: dict,
        user_profile: dict,
    ) -> dict:
        """Fully automated email generation (Option C)."""

        prompt = f"""Analyze the job and candidate profile, then generate the best possible application email.

JOB DATA:
{json.dumps(job_data, indent=2)}

CANDIDATE PROFILE:
{json.dumps(user_profile, indent=2)}

TASK:
1. Analyze job requirements deeply
2. Match candidate's strongest qualifications
3. Identify unique selling points
4. Generate highly personalized email

Return JSON:
{{
    "subject": "compelling subject line",
    "body": "professional email body",
    "match_analysis": "brief analysis of fit",
    "confidence_score": 0-100
}}"""

        content = await self._call_llm(prompt, max_tokens=1500)
        return self._parse_json(content)

    async def parse_job_description(self, job_text: str) -> dict:
        """Extract structured data from job description."""

        prompt = f"""Parse this job description and extract structured information:

{job_text[:3000]}

Return JSON format:
{{
    "title": "job title",
    "company": "company name",
    "location": "location",
    "job_type": "Full-time/Part-time/Contract/Remote",
    "required_skills": ["skill1", "skill2"],
    "experience_required": "X years",
    "salary_range": "if mentioned or null",
    "key_responsibilities": ["resp1", "resp2"],
    "summary": "2-3 sentence summary",
    "contact_email": "if found or null"
}}"""

        content = await self._call_llm(prompt)
        return self._parse_json(content)

    async def parse_resume(self, resume_text: str) -> dict:
        """Extract structured data from resume."""

        prompt = f"""Parse this resume and extract structured information:

{resume_text[:4000]}

Return JSON:
{{
    "name": "full name",
    "email": "email if found",
    "phone": "phone if found",
    "current_role": "current/latest job title",
    "skills": ["skill1", "skill2", "skill3"],
    "experience_years": estimated total years,
    "education": ["degree1", "degree2"],
    "summary": "professional summary",
    "achievements": ["achievement1", "achievement2"]
}}"""

        content = await self._call_llm(prompt)
        return self._parse_json(content)

    async def calculate_match_score(
        self, job_requirements: list[str], user_skills: list[str], user_experience: int
    ) -> dict:
        """Calculate how well user matches job requirements."""

        prompt = f"""Calculate match score between job and candidate:

JOB REQUIREMENTS:
{json.dumps(job_requirements)}

CANDIDATE:
- Skills: {json.dumps(user_skills)}
- Years of Experience: {user_experience}

Return JSON:
{{
    "score": 0-100,
    "matching_skills": ["skill1", "skill2"],
    "missing_skills": ["skill3"],
    "recommendation": "brief recommendation",
    "should_apply": true/false
}}"""

        content = await self._call_llm(prompt, max_tokens=512)
        return self._parse_json(content)


ai_service = AIService()
