#! /bin/bash 
echo "ENTER YOUR PROJECT ID :-"
read PROJECT_ID 
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format "value(projectNumber)")

echo "CONFIGURING THE PROJECT:- 🛠️"
gcloud config set  project $PROJECT_ID 
echo "ENABLING THE REQUIRED APIS"
gcloud services enable cloudbuild.googleapis.com  artifactregistry.googleapis.com \
compute.googleapis.com container.googleapis.com servicenetworking.googleapis.com  \
 sqladmin.googleapis.com  anthos.googleapis.com mesh.googleapis.com  \
 gkehub.googleapis.com pubsub.googleapis.com eventarc.googleapis.com cloudfunctions.googleapis.com \
 run.googleapis.com 
echo "CREATING THE ARTIFACT REPOSITORIES TO STORE DOCKER ARTIFACTS"
gcloud artifacts repositories create repo-vikretha --location us-central1 --description "storing vikretha artifacts " --labels=type=ecommerce --repository-format docker 
gcloud compute addresses create range-1 --network default \
--global --prefix-length 16 --purpose VPC_PEERING --description  "USED FOR CLOUD SQL SQL INSTANCE PRIVATE SERVICES ACCESS"
gcloud services vpc-peerings connect --service servicenetworking.googleapis.com --ranges range-1 --network default
BUCKET_ID=$PROJECT_ID-vikretha
gsutil mb gs://$BUCKET_ID 
gsutil iam ch allUsers:objectViewer gs://$BUCKET_ID
gsutil -m cp -r  images gs://$BUCKET_ID/vikretha-product-images/
gcloud beta sql instances create sql-vikretha --region us-central --network default --allocated-ip-range-name range-1 --root-password "gkem1234"
cd database-setup 
echo "ENTER gkem1234 WHEN PROMPTED FOR PASSWORD"
gcloud sql connect  sql-vikretha  --user root < $(pwd)/init-database.sql
sed -i "s/BUCKET_ID/$BUCKET_ID/g" catalog.json
gcloud builds submit -t us-central1-docker.pkg.dev/$PROJECT_ID/repo-vikretha/cloudsql-data-populator
cd ..
gcloud container clusters create ecommerce-vikretha-cluster --zone us-central1-a --num-nodes 2 --disk-type pd-standard \
--disk-size 100G --machine-type e2-standard-4 --workload-pool $PROJECT_ID.svc.id.goog --labels=mesh_id=proj-$PROJECT_NUMBER
gcloud iam service-accounts create sql-client 
gcloud iam service-accounts create frontend-pubsub-publisher
gcloud iam service-accounts create cloud-function-trigger 
kubectl create ns frontend
kubectl create sa   frontend -n frontend
kubectl create ns data 
kubectl create ns job
kubectl create sa sql-client -n job
kubectl create sa sql-client -n data
echo "CREATING THE PUBSUB TOPIC"
gcloud pubsub topics create order-info 
gcloud pubsub topics add-iam-policy-binding order-info \
--member "serviceAccount:frontend-pubsub-publisher@${PROJECT_ID}.iam.gserviceaccount.com" \
--role roles/pubsub.publisher
gcloud iam service-accounts add-iam-policy-binding  frontend-pubsub-publisher@${PROJECT_ID}.iam.gserviceaccount.com  \
  --member "serviceAccount:${PROJECT_ID}.svc.id.goog[frontend/frontend]" \
  --role roles/iam.workloadIdentityUser
gcloud projects add-iam-policy-binding $PROJECT_ID \
 --member "serviceAccount:cloud-function-trigger@${PROJECT_ID}.iam.gserviceaccount.com" \
 --role roles/eventarc.eventReceiver
 gcloud pubsub topics add-iam-policy-binding order-info \
 --member "serviceAccount:cloud-function-trigger@${PROJECT_ID}.iam.gserviceaccount.com" \
 --role roles/pubsub.subscriber 
gcloud projects add-iam-policy-binding $PROJECT_ID \
 --member "serviceAccount:cloud-function-trigger@${PROJECT_ID}.iam.gserviceaccount.com" \
 --role roles/run.invoker
gcloud projects add-iam-policy-binding $PROJECT_ID \
--member "serviceAccount:service-${PROJECT_NUMBER}@gcp-sa-pubsub.iam.gserviceaccount.com" \
--role roles/iam.serviceAccountTokenCreator
gcloud iam service-accounts add-iam-policy-binding  sql-client@$PROJECT_ID.iam.gserviceaccount.com  \
  --member "serviceAccount:${PROJECT_ID}.svc.id.goog[data/sql-client]" \
  --role roles/iam.workloadIdentityUser
gcloud iam service-accounts add-iam-policy-binding  sql-client@$PROJECT_ID.iam.gserviceaccount.com  \
  --member "serviceAccount:${PROJECT_ID}.svc.id.goog[job/sql-client]" \
  --role roles/iam.workloadIdentityUser
gcloud projects add-iam-policy-binding  $PROJECT_ID \
  --member "serviceAccount:sql-client@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role roles/cloudsql.client
find $(pwd)/k8s-files/ -type f  -name "*.yaml"      -exec sed -i "s/PROJECT_ID/${PROJECT_ID}/g" {} +
cd app
cd authentication-server
gcloud builds submit -t us-central1-docker.pkg.dev/$PROJECT_ID/repo-vikretha/authentication-server
cd ../cart-manager
gcloud builds submit -t us-central1-docker.pkg.dev/$PROJECT_ID/repo-vikretha/cart-manager
cd ../catalog-data-sender
gcloud builds submit -t us-central1-docker.pkg.dev/$PROJECT_ID/repo-vikretha/catalog-data-sender
cd ../frontend
gcloud builds submit -t us-central1-docker.pkg.dev/$PROJECT_ID/repo-vikretha/frontend
cd ../order-manager
gcloud builds submit -t us-central1-docker.pkg.dev/$PROJECT_ID/repo-vikretha/order-manager
cd ../product-info-getter
gcloud builds submit -t us-central1-docker.pkg.dev/$PROJECT_ID/repo-vikretha/product-info
cd ../..
export CLOUD_SQL_INSTANCE_IP=$(gcloud sql instances describe sql-vikretha --format "value(ipAddresses[1].ipAddress)")
kubectl create secret  generic sql-cred -n data --from-literal=host=$CLOUD_SQL_INSTANCE_IP --from-literal=user=root \
  --from-literal password=gkem1234 \
  --from-literal database=vikretha
kubectl create secret  generic sql-cred -n job --from-literal=host=$CLOUD_SQL_INSTANCE_IP --from-literal=user=root \
  --from-literal password=gkem1234 \
  --from-literal database=vikretha  
kubectl annotate sa sql-client -n job --overwrite iam.gke.io/gcp-service-account=sql-client@$PROJECT_ID.iam.gserviceaccount.com   
kubectl annotate sa sql-client -n data --overwrite iam.gke.io/gcp-service-account=sql-client@$PROJECT_ID.iam.gserviceaccount.com   
kubectl annotate sa frontend -n  frontend --overwrite iam.gke.io/gcp-service-account=frontend-pubsub-publisher@$PROJECT_ID.iam.gserviceaccount.com   
gcloud container clusters get-credentials ecommerce-vikretha-cluster --zone us-central1-a 
gcloud container fleet memberships register us-cluster --gke-cluster us-central1-a/ecommerce-vikretha-cluster \
--enable-workload-identity 
gcloud container fleet mesh enable
curl https://storage.googleapis.com/csm-artifacts/asm/asmcli > asmcli

chmod +x asmcli 
./asmcli install --cluster_name ecommerce-vikretha-cluster --cluster_location us-central1-a \
 --project_id $PROJECT_ID \
 --fleet_id $PROJECT_ID \
 --managed \
 --output_dir asm-samples \
 --channel rapid \
 --enable_all 

kubectl label  ns frontend  istio.io/rev=asm-managed-rapid 
kubectl label  ns data  istio.io/rev=asm-managed-rapid 
kubectl create ns gateway 
kubectl label  ns gateway istio.io/rev=asm-managed-rapid 
cd k8s-files 
kubectl apply -f .
cd ../asm-samples/samples/gateways/istio-ingressgateway
kubectl apply -f . -n gateway
kubectl apply -f ./autoscalingv2/  -n gateway
cd ../../../../k8s-files/
kubectl apply -f ./istio-security/
kubectl apply -f ./istio-service/
cd ../cloud-functions
echo "HERE YOU NEED TO PROVIDE YOU API KEY FOR JUVLON API"
read API_KEY
echo also "ENTER YOUR EMAIL  YOU REGISTERED WITH JUVILON TO SEND  ORDER EMAILS"
read EMAIL
gcloud functions deploy email-sender --runtime nodejs16  --entry-point email-sender --no-allow-unauthenticated \
--region us-central1 --source .  --gen2 --trigger-topic order-info \
--trigger-service-account cloud-function-trigger@${PROJECT_ID}.iam.gserviceaccount.com \
--max-instances 21 --set-env-vars=APIKEY=$APIKEY,EMAIL=$EMAIL
WEBSITE_URL=$(kubectl get services istio-ingressgateway -n gateway -o=jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "WEBSITE SUCCESSFULLY DEPLOYED YOU CAN VIEW IT HERE :-  http://${WEBSITE_URL}"


