from transformers import AutoTokenizer

def convert_span_to_iob2(text, annotations, tokenizer_model="bert-base-uncased"):
    """
    Convert span-based annotations to IOB2 tagging format.

    Args:
        text (str): The input text.
        annotations (list): List of annotations with start_index, end_index, entity, and text.
        tokenizer_model (str): The tokenizer model name to use (default: 'bert-base-uncased').

    Returns:
        dict: A dictionary containing tokens and IOB2 tags.
    """

    # Load the specified tokenizer
    tokenizer = AutoTokenizer.from_pretrained(tokenizer_model)
    
    # Tokenize the input text and get offsets
    tokenized = tokenizer(text, return_offsets_mapping=True, add_special_tokens=False)
    tokens = tokenized["input_ids"]
    offsets = tokenized["offset_mapping"]
    tokens_text = tokenizer.convert_ids_to_tokens(tokens)
    
    # Initialize IOB2 tags with "O"
    tags = ["O"] * len(tokens)
    
    # Process each annotation
    for annotation in annotations:
        start_idx = annotation["start_index"]
        end_idx = annotation["end_index"]
        entity = annotation["entity"]
        
        # Align spans with token offsets
        for idx, (start, end) in enumerate(offsets):
            if start >= start_idx and end <= end_idx:
                if start == start_idx:
                    tags[idx] = f"B-{entity}"
                else:
                    tags[idx] = f"I-{entity}"
    
    # Split tokens and tags into sentences (if text contains multiple sentences)
    sentences = []
    sentence_tags = []
    current_sentence = []
    current_sentence_tags = []
    for token, tag in zip(tokens_text, tags):
        current_sentence.append(token)
        current_sentence_tags.append(tag)
        if token in [".", "?", "!"]:  # Sentence-ending punctuation
            sentences.append(current_sentence)
            sentence_tags.append(current_sentence_tags)
            current_sentence = []
            current_sentence_tags = []
    if current_sentence:  # Add any remaining tokens as a sentence
        sentences.append(current_sentence)
        sentence_tags.append(current_sentence_tags)
    
    return {
        "tokens": sentences,
        "tags": sentence_tags
    }

#     # Example usage
# text = """GENCE FRANCE-PRESSE
# 2 International Business Park
# 11-02 The Strategy\nSingapore 609930
# (65) 6590 3788
# 583 Orchard Road #14-02 Forum The Shopping Mall\n238884 SINGAPORE
# Singapore
# 01-08-2024"""
# annotations = [
#     {"start_index": 25, "end_index": 44, "entity": "Address", "text": "GENCE FRANCE-PRESSE"},
#     {"start_index": 46, "end_index": 75, "entity": "Address", "text": "2 International Business Park"},
#     {"start_index": 79, "end_index": 115, "entity": "Address", "text": "11-02 The Strategy\\nSingapore 609930"},
#     {"start_index": 172, "end_index": 186, "entity": "TelephoneNumbers", "text": "(65) 6590 3788"},
#     {"start_index": 236, "end_index": 301, "entity": "Address", "text": "583 Orchard Road #14-02 Forum The Shopping Mall\\n238884 SINGAPORE"},
#     {"start_index": 303, "end_index": 312, "entity": "Address", "text": "Singapore"},
#     {"start_index": 343, "end_index": 353, "entity": "DateTimes", "text": "01-08-2024"}
# ]

# # Pass the tokenizer model name as a parameter
# result = convert_span_to_iob2(text, annotations, tokenizer_model="bert-base-uncased")
# print(result)