package WormBase::API::Service::lineage;

use Moose;

#with 'WormBase::API::Role::Object'; 


sub index{
	print("<running lineage index function>\n");

	return {
		test => 'data from controller'
	};
}


1;
