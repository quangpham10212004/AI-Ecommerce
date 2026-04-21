from rest_framework.response import Response
from rest_framework.views import APIView

from .rag_engine import (
    ensure_knowledge_base,
    generate_answer,
    get_neo4j_graph_stats,
    retrieve_documents,
)


class ChatAPIView(APIView):
    def post(self, request):
        query = request.data.get("query", "").strip()

        if not query:
            return Response({"response": "Please enter a question or advisory request."}, status=400)

        index_status = ensure_knowledge_base()
        retrieved_documents = retrieve_documents(query=query, limit=3)
        generated_answer = generate_answer(query, retrieved_documents)
        return Response(
            {
                "response": generated_answer["answer"],
                "sources": generated_answer["sources"],
                "retrieved_documents": retrieved_documents,
                "index_backend": index_status["backend"],
            }
        )


class ChatKnowledgeBaseStatusAPIView(APIView):
    def get(self, request):
        return Response(ensure_knowledge_base())


class ChatKnowledgeGraphStatusAPIView(APIView):
    def get(self, request):
        try:
            return Response(
                {
                    "backend": "neo4j",
                    "graph_stats": get_neo4j_graph_stats(),
                }
            )
        except RuntimeError:
            index_status = ensure_knowledge_base()
            return Response(
                {
                    "backend": index_status["backend"],
                    "graph_stats": index_status.get("graph_stats"),
                }
            )
